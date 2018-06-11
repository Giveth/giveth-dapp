pragma solidity ^0.4.19;

import "../ERC20.sol";
import "../SafeMath.sol";


contract TestToken is ERC20 {
  
    using SafeMath for uint256;

    bool failOnTransfer;
    uint totalSupply_;
    mapping(address => uint) balances;
    mapping (address => mapping (address => uint)) allowed;

    function TestToken(address _addr, uint256 _amount) public {
        balances[_addr] = _amount;
        totalSupply_ = _amount;
    }

    function setFailOnTransfer(bool _fail) public {
        failOnTransfer = _fail;
    }

    function totalSupply() public constant returns (uint256 supply) {
        return totalSupply_;
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        if (failOnTransfer) {
            return false;
        }
        balances[msg.sender] = balances[msg.sender].sub(_value);
        balances[_to] = balances[_to].add(_value);
        Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        if (failOnTransfer) {
            return false;
        }

        var _allowance = allowed[_from][msg.sender];

        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        allowed[_from][msg.sender] = _allowance.sub(_value);
        Transfer(_from, _to, _value);
        return true;
    }

    function balanceOf(address _owner) public constant returns (uint256 balance) {
        return balances[_owner];
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) public constant returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }

}
