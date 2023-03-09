// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

error InvalidInvoiceId();
error InvalidAddress();
error IncorrectTransactionValue();

// TODO interface
abstract contract InvoiceFactory is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_TERMINATION_TIME = 63113904; // 2-year limit on locker
    address public wrappedNativeToken;

    uint256 internal invoiceCount = 0;
    mapping(uint256 => InvoiceMetadata) internal invoices;
    mapping(address => uint256[]) providerToInvoices;
    mapping(address => uint256[]) clientToInvoices;

    struct InvoiceMetadata {
        address client;
        address provider;
        address token;
        uint256 terminationTime;
        uint256 total;
        uint256 currMilestone;
        uint256 amountReleased;
        uint256[] amounts; // milestones split into amounts
    }

    event Created(
        uint256 indexed id,
        address indexed client,
        address indexed provider,
        uint256[] amounts
    );
    event Deposit(
        uint256 invoiceId,
        bool isErc721,
        address indexed sender,
        address token,
        uint256 amount
    );
    event Release(uint256 milestone, uint256 amount);
    event Withdraw(uint256 invoiceId, uint256 balance);
    event Verified(address indexed client, address indexed invoice);

    function createInvoice(
        address _client,
        address _provider,
        address _token,
        uint256[] calldata _amounts,
        uint256 _terminationTime // exact termination date in seconds since epoch
    ) external {
        require(_client != address(0), "invalid client");
        require(_provider != address(0), "invalid provider");
        require(_token != address(0), "invalid token");
        require(_terminationTime > block.timestamp, "duration ended");
        require(
            _terminationTime <= block.timestamp + MAX_TERMINATION_TIME,
            "duration too long"
        );

        uint256 nextId = invoiceCount;
        uint256 total = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            total = total + _amounts[i];
        }
        invoices[nextId] = InvoiceMetadata({
            client: _client,
            provider: _provider,
            token: _token,
            terminationTime: _terminationTime,
            total: total,
            currMilestone: 0,
            amountReleased: 0,
            amounts: _amounts
        });
        providerToInvoices[_provider].push(nextId);
        clientToInvoices[_client].push(nextId);

        // _safeMint(_client, nextId);
        invoiceCount = invoiceCount + 1;

        emit Created(nextId, _client, _provider, _amounts);
    }

    function getInvoice(uint256 id)
        public
        view
        returns (InvoiceMetadata memory)
    {
        if (id < 0 || id >= invoiceCount) revert InvalidInvoiceId();
        return invoices[id];
    }

    function getInvoicesByProvider(address provider)
        external
        view
        returns (uint256[] memory)
    {
        return providerToInvoices[provider];
    }

    function getInvoicesByClient(address client)
        external
        view
        returns (uint256[] memory)
    {
        return clientToInvoices[client];
    }

    function deposit(
        uint256 invoiceId,
        address token,
        uint256[] memory amounts,
        bool isErc721
    ) public payable nonReentrant {
        if (invoiceId < 0 || invoiceId >= invoiceCount)
            revert InvalidInvoiceId();
        InvoiceMetadata memory invoice = invoices[invoiceId];
        if (msg.sender != invoice.client) revert InvalidAddress();

        uint256 sum = 0;
        for (uint256 i; i < amounts.length; ++i) {
            sum += amounts[i];
        }

        // ETH transfer
        if (msg.value != 0) {
            if (msg.value != sum) revert IncorrectTransactionValue();
            // Overrides to clarify ETH is used.
            if (token != address(0)) token = address(0);
            if (isErc721) isErc721 = false;
        } else {
            // ERC-20/ERC-721 transfer
            safeTransferFrom(token, msg.sender, address(this), sum);
        }

        emit Deposit(invoiceId, isErc721, msg.sender, token, sum);
    }

    // TODO don't understand this. Better to use safeTransferFrom from openzeppelin
    function safeTransferFrom(
        address token,
        address sender,
        address recipient,
        uint256 amount
    ) internal {
        bool callStatus;

        assembly {
            // Get a pointer to some free memory.
            let freeMemoryPointer := mload(0x40)

            // Write the abi-encoded calldata to memory piece by piece:
            mstore(
                freeMemoryPointer,
                0x23b872dd00000000000000000000000000000000000000000000000000000000
            ) // Begin with the function selector.
            mstore(
                add(freeMemoryPointer, 4),
                and(sender, 0xffffffffffffffffffffffffffffffffffffffff)
            ) // Mask and append the "from" argument.
            mstore(
                add(freeMemoryPointer, 36),
                and(recipient, 0xffffffffffffffffffffffffffffffffffffffff)
            ) // Mask and append the "to" argument.
            mstore(add(freeMemoryPointer, 68), amount) // Finally append the "amount" argument. No mask as it's a full 32 byte value.

            // Call the token and store if it succeeded or not.
            // We use 100 because the calldata length is 4 + 32 * 3.
            callStatus := call(gas(), token, 0, freeMemoryPointer, 100, 0, 0)
        }

        require(
            didLastOptionalReturnCallSucceed(callStatus),
            "TRANSFER_FROM_FAILED"
        );
    }

    function didLastOptionalReturnCallSucceed(bool callStatus)
        private
        pure
        returns (bool success)
    {
        assembly {
            // If the call reverted:
            if iszero(callStatus) {
                // Copy the revert message into memory.
                returndatacopy(0, 0, returndatasize())

                // Revert with the same message.
                revert(0, returndatasize())
            }

            switch returndatasize()
            case 32 {
                // Copy the return data into memory.
                returndatacopy(0, 0, returndatasize())

                // Set success to whether it returned true.
                success := iszero(iszero(mload(0)))
            }
            case 0 {
                // There was no return data.
                success := 1
            }
            default {
                // It returned some malformed output.
                success := 0
            }
        }
    }

    // function release(uint256 invoiceId) external override nonReentrant {
    //     if (invoiceId < 0 || invoiceId >= invoiceCount)
    //         revert InvalidInvoiceId();
    //     InvoiceMetadata memory invoice = invoices[invoiceId];
    //     if (msg.sender != invoice.client) revert InvalidAddress();

    //     uint256 currentMilestone = milestone;
    //     uint256 balance = IERC20(token).balanceOf(address(this));

    //     if (currentMilestone < amounts.length) {
    //         uint256 amount = amounts[currentMilestone];
    //         if (currentMilestone == amounts.length - 1 && amount < balance) {
    //             amount = balance;
    //         }
    //         require(balance >= amount, "insufficient balance");

    //         milestone = milestone + 1;
    //         IERC20(token).safeTransfer(provider, amount);
    //         released = released + amount;
    //         emit Release(currentMilestone, amount);
    //     } else {
    //         require(balance > 0, "balance is 0");

    //         IERC20(token).safeTransfer(provider, balance);
    //         released = released + balance;
    //         emit Release(currentMilestone, balance);
    //     }
    // }

    // function release(uint256 invoiceId, uint256 _milestone)
    //     external
    //     override
    //     nonReentrant
    // {
    //     // client transfers locker funds upto certain milestone to provider
    //     require(!locked, "locked");
    //     require(_msgSender() == client, "!client");
    //     require(_milestone >= milestone, "milestone passed");
    //     require(_milestone < amounts.length, "invalid milestone");
    //     uint256 balance = IERC20(token).balanceOf(address(this));
    //     uint256 amount = 0;
    //     for (uint256 j = milestone; j <= _milestone; j++) {
    //         if (j == amounts.length - 1 && amount + amounts[j] < balance) {
    //             emit Release(j, balance - amount);
    //             amount = balance;
    //         } else {
    //             emit Release(j, amounts[j]);
    //             amount = amount + amounts[j];
    //         }
    //     }
    //     require(balance >= amount, "insufficient balance");

    //     IERC20(token).safeTransfer(provider, amount);
    //     released = released + amount;
    //     milestone = _milestone + 1;
    // }

    // // withdraw locker remainder to client if termination time passes & no lock
    // function withdraw(uint256 invoiceId) external override nonReentrant {
    //     if (invoiceId < 0 || invoiceId >= invoiceCount)
    //         revert InvalidInvoiceId();
    //     InvoiceMetadata memory invoice = invoices[invoiceId];
    //     if (msg.sender != invoice.client) revert InvalidAddress();
    //     require(block.timestamp > terminationTime, "!terminated");
    //     uint256 balance = IERC20(invoice.token).balanceOf(invoice.client);
    //     require(balance > 0, "balance is 0");

    //     // TODO: erc721
    //     IERC20(token).safeTransfer(client, balance);
    //     milestone = amounts.length;

    //     emit Withdraw(invoiceId, balance);
    // }
}
