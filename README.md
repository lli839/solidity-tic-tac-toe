# Upgrade Contract
1. [Implemented] Create a isPaused flag. Only owner can set this flag. 
    * Before upgrade, owner set isPaused=true, then no data can be added/modified in the smart contract. 
    * During upgrade, write a script to dump data from old contract to the new one.
    * After upgrade, dump the old contract.
    * Pros:
        * Flexible: new contract may have different data schema. We can write customized ETL script to ingest data to the new one.
    * Cons:
        * If just upgrade the logic functions, we still need migrate data. Vice versa.
2. Proxy pattern. Seperate data storage and logic.
    * The parent contract has its own data/state, but has a variable that points to the implementation contract address. 
    * Pros:
        * data and logic are seperated.

# Problems During Implementation

# Audit
1. Test common vulnerabilities
* reentrancy
* access control
* return values
* overflow
2. thorough integration test to avoid logical bugs
3. bounty program
4. monitoring
5. audit
