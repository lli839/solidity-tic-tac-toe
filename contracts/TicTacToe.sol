// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

contract TicTacToe {

    address public owner;
    uint32 public gameCnt;
    bool public isPaused;

    struct GameStat {
        address player1;
        address player2;
        uint8[3][3] board; // board[i][j] = 0: not occupied, 1: player1, 2: player
        uint8 gameStatus; // 0:ongoing, 1: player1 wins, 2: player wins, 3: tie
        bool isPlayer1Turn;
        bool isPlayer1X; // is player1 use X
    }

    mapping (uint32 => GameStat) public gameId2Stat;
    mapping (address => uint32) public player2activeGameId;

    modifier onlyOwner() {
        require(msg.sender==owner, "must be owner to do this op");
        _;
    }

    constructor() {
        owner = msg.sender;
        isPaused = false;
    }

    // this is used to pause the smart contract and migrate data to a new one.
    function setIsPaused() public onlyOwner {
        isPaused = !isPaused;
    }

    // one player can only have 1 ongoing game
    function startNewGame() public returns(uint32) {
        require(!isPaused, "smart contract paused");

        require(player2activeGameId[msg.sender]==0, "should not have any active game");

        // start a new game
        uint32 gameId = gameCnt + 1;
        player2activeGameId[msg.sender] = gameId;

        // set init value
        uint8[3][3] memory board = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
        ];
        gameId2Stat[gameId] = GameStat(msg.sender, address(0), board, 0, true, true);

        // update gameCnt
        gameCnt++;

        return gameId;
    }

    function joinGame(uint32 gameId) public {
        require(!isPaused, "smart contract paused");

        require(gameId2Stat[gameId].player1 != address(0), "gameId not exist");
        require(gameId2Stat[gameId].player2 == address(0), "cannot join since there are already 2 players");

        gameId2Stat[gameId].player2 = msg.sender;
        player2activeGameId[msg.sender] = gameId;

        bytes32 hash = keccak256(abi.encodePacked(
            gameId2Stat[gameId].player1,
            gameId2Stat[gameId].player2
        ));
        // get first bit of hash
        bool isPlayer1X = uint8(hash[31] & 0x80) >> 7!=0;
        gameId2Stat[gameId].isPlayer1X = isPlayer1X;
        gameId2Stat[gameId].isPlayer1Turn = isPlayer1X;
    }

    function whoseTurn(uint32 gameId) public returns(address) {
        require(!isPaused, "smart contract paused");

        require(gameId2Stat[gameId].player1!=address(0), "gameId not exist");
        require(gameId2Stat[gameId].player2 != address(0), "the game should have 2 players");
        require(gameId2Stat[gameId].gameStatus==0, "must be active game");
        return gameId2Stat[gameId].isPlayer1Turn ? gameId2Stat[gameId].player1 : gameId2Stat[gameId].player2;
    }

    function checkGameStatus(uint8[3][3] memory board) private pure returns(uint8) {
        // check if we find a winner in rows
        for (uint8 i=0; i<3; i++) {
            if (board[i][0] == board[i][1] && board[i][0] == board[i][2]) {
                return board[i][0];
            }
        }

        // check if we find a winner in cols
        for (uint8 j=0; j<3; j++) {
            if (board[0][j] == board[1][j] && board[0][j] == board[2][j]) {
                return board[0][j];
            }
        }

        // find diagonal
        if (board[0][0] == board[1][1] && board[0][0] == board[2][2]) {
            return board[1][1];
        }
        if (board[0][2] == board[1][1] && board[0][2] == board[2][0]) {
            return board[1][1];
        }

        // check if there is tie
        uint32 occupiedCnt = 0;
        for (uint8 i=0; i<3; i++) {
            for (uint8 j=0; j<3; j++) {
                if (board[i][j] != 0) {
                    occupiedCnt++;
                }
            }
        }
        if (occupiedCnt == 9) return 3; // tie
        return 0; // still ongoing
    }

    function makeMove(uint32 gameId, uint8 i, uint8 j) public returns(uint8){
        require(!isPaused, "smart contract paused");

        GameStat memory _gameStat = gameId2Stat[gameId];
        // check gameId exists, ongoing
        require(gameId2Stat[gameId].player1!=address(0), "gameId not exist");
        require(_gameStat.player2 != address(0), "the game should have 2 players");
        require(_gameStat.player1==msg.sender || _gameStat.player2==msg.sender, "Not your game");
        require(_gameStat.gameStatus==0, "must be active game");

        require(player2activeGameId[msg.sender]==gameId, "Not your game");

        // check i, j are in range, and not occupied
        require(i>=0 && i<3 && j>=0 && j<3, "invalid i, j range");
        require(_gameStat.board[i][j]==0, "i,j already occupied");

        // check correct turn
        require(msg.sender == (_gameStat.isPlayer1Turn?_gameStat.player1:_gameStat.player2), "Not your turn");

        // make move
        uint8 playerId = _gameStat.player1==msg.sender ? 1 : 2;
        gameId2Stat[gameId].board[i][j] = playerId;

        // check if game finished(one player success, or tie)
        uint8 newGameStatus = checkGameStatus(gameId2Stat[gameId].board);
        gameId2Stat[gameId].gameStatus = newGameStatus;

        gameId2Stat[gameId].isPlayer1Turn = !gameId2Stat[gameId].isPlayer1Turn;

        // if game finished, update player2activeGameId
        if (newGameStatus != 0) {
            delete player2activeGameId[_gameStat.player1];
            delete player2activeGameId[_gameStat.player2];
        }

        // return status: 0: you win, 1: tie, 2: onoging
        return newGameStatus;
    }
}
