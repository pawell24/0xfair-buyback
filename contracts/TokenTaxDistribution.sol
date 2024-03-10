// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IUniswapV2Router02 {
    function WETH() external pure returns (address);
    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable;
}

interface ITaxToken {
    function addInitialLiquidity(uint256 tokenAmount) external payable;
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transferOwnership(address newOwner) external;
    function burn(uint256 value) external;
}

interface IFairStaking {
    function depositRewardTokens(uint256 _amount) external;
}

contract TokenTaxDistribution {
    address public immutable recipient;
    IUniswapV2Router02 public immutable uniswapV2Router;
    uint256 public taxPercentage = 30;
    uint256 public burnPercentage = 5;
    ITaxToken public token;
    address public owner;
    IFairStaking public fairStaking;

    constructor(
        address _recipient,
        address _uniswapRouter,
        address _tokenAddress,
        address _fairStakingAddress
    ) {
        owner = msg.sender;
        recipient = _recipient;
        uniswapV2Router = IUniswapV2Router02(_uniswapRouter);
        token = ITaxToken(_tokenAddress);
        fairStaking = IFairStaking(_fairStakingAddress);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    receive() external payable {
        require(msg.value > 0, "Must send ETH");

        uint256 amountToKeep = (msg.value * taxPercentage) / 100;
        uint256 amountToSend = msg.value - amountToKeep;

        payable(recipient).transfer(amountToSend);
    }

    function buyAndDepositTokens() external {
        require(address(this).balance >= 0.5 ether, "Insufficient ETH balance");

        address[] memory path = new address[](2);
        path[0] = uniswapV2Router.WETH();
        path[1] = address(token);

        uniswapV2Router.swapExactETHForTokensSupportingFeeOnTransferTokens{
            value: 0.5 ether
        }(0, path, address(this), block.timestamp);

        uint256 amount = token.balanceOf(address(this));

        uint256 burnAmount = (amount * burnPercentage) / 100;

        token.burn(burnAmount);

        token.approve(address(fairStaking), amount - burnAmount);

        fairStaking.depositRewardTokens(amount - burnAmount);
    }

    function manuallyWithdrawETH(uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient ETH balance");
        payable(owner).transfer(amount);
    }

    function manuallyTransferTokens(
        address to,
        uint256 amount
    ) external onlyOwner {
        require(
            token.balanceOf(address(this)) >= amount,
            "Insufficient token balance"
        );
        require(token.transfer(to, amount), "Transfer failed");
    }

    function setTaxPercentage(uint256 _taxPercentage) external onlyOwner {
        require(_taxPercentage <= 100, "Tax percentage should be <= 100");
        taxPercentage = _taxPercentage;
    }

    function setBurnPercentage(uint256 _burnPercentage) external onlyOwner {
        require(_burnPercentage <= 100, "Burn percentage should be <= 100");
        burnPercentage = _burnPercentage;
    }
}
