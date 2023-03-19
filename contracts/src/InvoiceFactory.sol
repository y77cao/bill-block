// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error InvalidInvoiceId();
error InvalidAddress();
error IncorrectTransactionValue();
error InvalidTerminationTime();
error TokenUnmatch();
error IncorrectInvoiceStatus();
error InsufficientAllowance();
error InvalidRelease();
error InsufficientBalance();
error ReleaseFailure();
error InvoiceNotTerminated();

// TODO interface
contract InvoiceFactory is ReentrancyGuard, IERC721Receiver {
    using SafeERC20 for IERC20;

    enum InvoiceStatus {
        CREATED,
        FUNDED,
        PARTIALLY_PAID,
        PAID,
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
        uint256 id;
        uint256 terminationTime;
        uint256 total;
        uint256 currMilestone;
        uint256 amountReleased;
        uint256[] amounts; // milestones split into amounts
        bool isErc721;
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

    function createInvoice(
        address client,
        address provider,
        address token,
        uint256[] calldata amounts,
        uint256 terminationTime, // exact termination date in seconds since epoch
        bool isErc721
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
            id: nextId,
            terminationTime: terminationTime,
            total: total,
            currMilestone: 0,
            amountReleased: 0,
            amounts: amounts,
            status: InvoiceStatus.CREATED,
            isErc721: isErc721
        });
        providerToInvoices[provider].push(nextId);
        clientToInvoices[client].push(nextId);

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
        returns (InvoiceMetadata[] memory)
    {
        uint256[] memory ids = providerToInvoices[provider];
        InvoiceMetadata[] memory allInvoices = new InvoiceMetadata[](
            ids.length
        );

        for (uint256 i = 0; i < ids.length; i++) {
            allInvoices[i] = invoices[ids[i]];
        }

        return allInvoices;
    }

    function getInvoicesByClient(address client)
        external
        view
        returns (InvoiceMetadata[] memory)
    {
        uint256[] memory ids = clientToInvoices[client];
        InvoiceMetadata[] memory allInvoices = new InvoiceMetadata[](
            ids.length
        );

        for (uint256 i = 0; i < ids.length; i++) {
            allInvoices[i] = invoices[ids[i]];
        }

        return allInvoices;
    }

    function deposit(
        uint256 invoiceId,
        address token,
        uint256[] memory amounts,
        bool isErc721
    ) public payable nonReentrant {
        if (invoiceId < 0 || invoiceId >= invoiceCount)
            revert InvalidInvoiceId();
        InvoiceMetadata storage invoice = invoices[invoiceId];

        if (msg.sender != invoice.client) revert InvalidAddress();
        if (invoice.status != InvoiceStatus.CREATED)
            revert IncorrectInvoiceStatus();
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
                uint256 allowedToTransfer = IERC20(token).allowance(
                    msg.sender,
                    address(this)
                );
                if (allowedToTransfer < sum) revert InsufficientAllowance();
                IERC20(token).safeTransferFrom(msg.sender, address(this), sum);
            }
        }

        emit Deposit(invoiceId, isErc721, msg.sender, token, amounts);
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }

    function release(uint256 invoiceId, uint256 releaseUntil)
        external
        nonReentrant
    {
        if (invoiceId < 0 || invoiceId >= invoiceCount)
            revert InvalidInvoiceId();
        InvoiceMetadata storage invoice = invoices[invoiceId];
        if (msg.sender != invoice.client) revert InvalidAddress();
        if (
            invoice.currMilestone >= releaseUntil ||
            invoice.amounts.length < releaseUntil ||
            releaseUntil < 1
        ) revert InvalidRelease();

        invoice.status = releaseUntil == invoice.amounts.length
            ? InvoiceStatus.PAID
            : InvoiceStatus.PARTIALLY_PAID;

        if (invoice.isErc721) {
            invoice.amountReleased += invoice.amounts[0];
            invoice.currMilestone = releaseUntil;
            IERC721(invoice.token).safeTransferFrom(
                address(this),
                invoice.provider,
                invoice.amounts[0]
            );
            emit Release(releaseUntil, invoice.amounts[0]);
            return;
        }

        uint256 releaseTotal = 0;
        for (uint256 i = invoice.currMilestone; i < releaseUntil; ++i) {
            releaseTotal += invoice.amounts[i];
        }

        invoice.amountReleased += releaseTotal;
        invoice.currMilestone = releaseUntil;

        if (invoice.token == address(0)) {
            if (address(this).balance < releaseTotal)
                revert InsufficientBalance();
            (bool sent, ) = invoice.provider.call{value: releaseTotal}("");
            if (!sent) revert ReleaseFailure();
        } else {
            uint256 balance = IERC20(invoice.token).balanceOf(address(this));
            if (balance < releaseTotal) revert InsufficientBalance();
            IERC20(invoice.token).safeTransfer(invoice.provider, releaseTotal);
        }

        emit Release(releaseUntil, releaseTotal);
    }

    // withdraw locker remainder to client if termination time passes
    function withdraw(uint256 invoiceId) external nonReentrant {
        if (invoiceId < 0 || invoiceId >= invoiceCount)
            revert InvalidInvoiceId();
        InvoiceMetadata storage invoice = invoices[invoiceId];
        if (msg.sender != invoice.client) revert InvalidAddress();
        if (block.timestamp > invoice.terminationTime)
            revert InvoiceNotTerminated();

        invoice.status = InvoiceStatus.TERMINATED;

        if (invoice.isErc721) {
            if (invoice.amountReleased == 0) {
                invoice.amountReleased = invoice.amounts[0];
                invoice.currMilestone = invoice.amounts.length;
                IERC721(invoice.token).safeTransferFrom(
                    address(this),
                    invoice.client,
                    invoice.amounts[0]
                );
            }
            emit Withdraw(invoiceId, invoice.amounts[0]);
            return;
        }

        uint256 withdrawTotal = 0;
        for (
            uint256 i = invoice.currMilestone;
            i < invoice.amounts.length;
            ++i
        ) {
            withdrawTotal += invoice.amounts[i];
        }

        invoice.currMilestone = invoice.amounts.length;
        invoice.amountReleased = invoice.total;

        if (invoice.token == address(0)) {
            if (address(this).balance < withdrawTotal)
                revert InsufficientBalance();
            (bool sent, ) = invoice.client.call{value: withdrawTotal}("");
            if (!sent) revert ReleaseFailure();
        } else {
            uint256 balance = IERC20(invoice.token).balanceOf(address(this));
            if (balance < withdrawTotal) revert InsufficientBalance();
            IERC20(invoice.token).safeTransfer(invoice.client, withdrawTotal);
        }
        emit Withdraw(invoiceId, withdrawTotal);
    }
}
