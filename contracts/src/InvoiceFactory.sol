// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error InvalidInvoiceId();
error InvalidAddress();
error IncorrectTransactionValue();
error InvalidTerminationTime();
error TokenUnmatch();

// TODO interface
contract InvoiceFactory is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum InvoiceStatus {
        CREATED,
        FUNDED,
        TERMINATED
    }
    uint256 public constant MAX_TERMINATION_TIME = 63113904; // 2-year
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
        InvoiceStatus status;
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
        uint256[] amounts
    );
    event Release(uint256 milestone, uint256 amount);
    event Withdraw(uint256 invoiceId, uint256 balance);
    event Verified(address indexed client, address indexed invoice);

    function createInvoice(
        address client,
        address provider,
        address token,
        uint256[] calldata amounts,
        uint256 terminationTime // exact termination date in seconds since epoch
    ) external {
        if (client == address(0) || (provider == address(0)))
            revert InvalidAddress();
        if (
            terminationTime < block.timestamp ||
            terminationTime > block.timestamp + MAX_TERMINATION_TIME
        ) revert InvalidTerminationTime();

        // TODO check token address is erc??

        uint256 nextId = invoiceCount;
        uint256 total = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            total = total + amounts[i];
        }
        invoices[nextId] = InvoiceMetadata({
            client: client,
            provider: provider,
            token: token,
            terminationTime: terminationTime,
            total: total,
            currMilestone: 0,
            amountReleased: 0,
            amounts: amounts,
            status: InvoiceStatus.CREATED
        });
        providerToInvoices[provider].push(nextId);
        clientToInvoices[client].push(nextId);

        // _safeMint(_client, nextId);
        invoiceCount = invoiceCount + 1;

        emit Created(nextId, client, provider, amounts);
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
        if (token != invoice.token) revert TokenUnmatch();

        uint256 sum = 0;
        for (uint256 i; i < amounts.length; ++i) {
            sum += amounts[i];
        }

        invoice.status = InvoiceStatus.FUNDED;
        // ETH transfer
        if (msg.value != 0) {
            if (msg.value != sum) revert IncorrectTransactionValue();
            if (msg.value != invoice.total) revert IncorrectTransactionValue();
            if (token != address(0) || isErc721) revert TokenUnmatch();
        } else {
            // ERC-20/ERC-721 transfer
            if (isErc721) {
                // TODO validate, transfer all
                IERC721(token).safeTransferFrom(
                    msg.sender,
                    address(this),
                    amounts[0]
                );
            } else {
                if (invoice.total != sum) revert IncorrectTransactionValue();
                IERC20(token).safeTransferFrom(msg.sender, address(this), sum);
            }
        }

        emit Deposit(invoiceId, isErc721, msg.sender, token, amounts);
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
