const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

describe("TicTacToe", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployTicTacToe() {
       // Contracts are deployed using the first signer/account by default
    const [owner, player1, player2, player3, player4] = await ethers.getSigners();

    const TicTacToe = await ethers.getContractFactory("TicTacToe");
    const contract = await TicTacToe.deploy();
    return {
      contract,
      owner,
      player1,
      player2,
      player3,
      player4
    };
  }

  describe("Deployment", function () {

    it("Should set the right owner", async function () {
      const { contract, owner } = await loadFixture(deployTicTacToe);

      expect(await contract.owner()).to.equal(owner.address);
    });
  });

  describe("Playing", function() {
    let contract, owner, player1, player2, player3, player4, first, second;

    beforeEach(async() => {
      let temp = await loadFixture(deployTicTacToe);
      contract = temp.contract;
      owner = temp.owner;
      player1 = temp.player1;
      player2 = temp.player2;
      player3 = temp.player3;
      player4 = temp.player4;
      // console.log('temp=', temp, 'owner=', owner, 'player1=', player1)

      // before start, no player in game
      expect(await contract.player2activeGameId(player1.address)).eq(0);
      expect(await contract.player2activeGameId(player2.address)).eq(0);
      expect(await contract.player2activeGameId(player3.address)).eq(0);
      expect(await contract.player2activeGameId(player4.address)).eq(0);

      // should be empty
      temp = await contract.gameId2Stat(0);
      expect(temp[0]).eq(ZERO_ADDRESS)
    });

    it("should start new game, and player1 wins", async function() {
      // player 1 start
      await contract.connect(player1).startNewGame();
      let gameId = 1;
      expect(await contract.player2activeGameId(player1.address)).eq(gameId);
      expect(await contract.player2activeGameId(player2.address)).eq(0);
      expect(await contract.gameCnt()).eq(1);

      let gameStat = await contract.gameId2Stat(gameId);
      expect(gameStat[0]).eq(player1.address);
      expect(gameStat[1]).eq(ZERO_ADDRESS);
      expect(gameStat[2]).eq(0);

      // player 2 accepts
      await contract.connect(player2).joinGame(gameId);
      gameStat = await contract.gameId2Stat(gameId);
      expect(gameStat[0]).eq(player1.address);
      expect(gameStat[1]).eq(player2.address);
      expect(gameStat[2]).eq(0);

      if (gameStat[3]) {
        first = player1; second = player2;
      } else {
        first = player2; second = player1;
      }
      // console.log('isPlayer1First=', gameStat[3])

      // player1 make move
      await contract.connect(first).makeMove(gameId, 0, 0);
      gameStat = await contract.gameId2Stat(gameId);
      expect(gameStat[2]).eq(0);

      // player2 make move
      await contract.connect(second).makeMove(gameId, 1, 0);
      gameStat = await contract.gameId2Stat(gameId);
      expect(gameStat[2]).eq(0);

      // player1 make move
      await contract.connect(first).makeMove(gameId, 0, 1);
      gameStat = await contract.gameId2Stat(gameId);
      expect(gameStat[2]).eq(0);

      // player2 make move
      await contract.connect(second).makeMove(gameId, 1, 1);
      gameStat = await contract.gameId2Stat(gameId);
      expect(gameStat[2]).eq(0);

      // player1 make move. player1 wins now
      await contract.connect(first).makeMove(gameId, 0, 2);
      gameStat = await contract.gameId2Stat(gameId);
      expect(gameStat[2]).eq(2);
      expect(await contract.player2activeGameId(player1.address)).eq(0);
      expect(await contract.player2activeGameId(player2.address)).eq(0);
    });

    it("When 1 player wins, can start a new game.", async function() {
      // player 1 start
      await contract.connect(player1).startNewGame();
      let gameId = 1;
      // player 2 accepts
      await contract.connect(player2).joinGame(gameId);

      let gameStat = await contract.gameId2Stat(gameId);
      if (gameStat[3]) {
        first = player1; second = player2;
      } else {
        first = player2; second = player1;
      }
      // console.log('isPlayer1First=', gameStat[3])

      // player1 make move
      await contract.connect(first).makeMove(gameId, 0, 0);

      // player2 make move
      await contract.connect(second).makeMove(gameId, 1, 0);

      // player1 make move
      await contract.connect(first).makeMove(gameId, 0, 1);

      // player2 make move
      await contract.connect(second).makeMove(gameId, 1, 1);

      // player1 make move. player1 wins now
      await contract.connect(first).makeMove(gameId, 0, 2);


      // after game is done, player1 can start a new game with player3
      // player 1 start gameId = 1
      await contract.connect(player1).startNewGame();
      gameId = 2;
      expect(await contract.player2activeGameId(player1.address)).eq(gameId);
      expect(await contract.gameCnt()).eq(2);

      // player 3 accepts
      await contract.connect(player3).joinGame(gameId);

      gameStat = await contract.gameId2Stat(gameId);
      if (gameStat[3]) {
        first = player1; second = player3;
      } else {
        first = player3; second = player1;
      }
      // console.log('isPlayer1First=', gameStat[3])

      // player1 make move
      await contract.connect(first).makeMove(gameId, 0, 0);

      // player3 make move
      await contract.connect(second).makeMove(gameId, 1, 0);
    });

    /**
     *    o x o
     *    x o x
     *    x o x
     */
    it("When there is a tie", async function() {
      // player 1 start
      await contract.connect(player1).startNewGame();
      let gameId = 1;
      // player 2 accepts
      await contract.connect(player2).joinGame(gameId);
      let gameStat = await contract.gameId2Stat(gameId);
      if (gameStat[3]) {
        first = player1; second = player2;
      } else {
        first = player2; second = player1;
      }

      // player1 make move
      await contract.connect(first).makeMove(gameId, 0, 1);

      // player2 make move
      await contract.connect(second).makeMove(gameId, 0, 0);

      // player1 make move
      await contract.connect(first).makeMove(gameId, 1, 0);

      // player2 make move
      await contract.connect(second).makeMove(gameId, 0, 2);

      // player1 make move.
      await contract.connect(first).makeMove(gameId, 1, 2);

      // player2 make move
      await contract.connect(second).makeMove(gameId, 1, 1);

      // player1 make move.
      await contract.connect(first).makeMove(gameId, 2, 0);

      // player2 make move
      await contract.connect(second).makeMove(gameId, 2, 1);

      // player1 make move.
      await contract.connect(first).makeMove(gameId, 2, 2);

      gameStat = await contract.gameId2Stat(gameId);
      expect(gameStat.gameStatus).eq(3);
      expect(await contract.player2activeGameId(first.address)).eq(0)
      expect(await contract.player2activeGameId(second.address)).eq(0)
    })
  });

  describe("Playing", function() {
    let contract, owner, player1, player2, player3, player4, first, second;

    beforeEach(async() => {
      let temp = await loadFixture(deployTicTacToe);
      contract = temp.contract;
      owner = temp.owner;
      player1 = temp.player1;
      player2 = temp.player2;
      player3 = temp.player3;
      player4 = temp.player4;
      // console.log('temp=', temp, 'owner=', owner, 'player1=', player1)

      // before start, no player in game
      expect(await contract.player2activeGameId(player1.address)).eq(0);
      expect(await contract.player2activeGameId(player2.address)).eq(0);
      expect(await contract.player2activeGameId(player3.address)).eq(0);
      expect(await contract.player2activeGameId(player4.address)).eq(0);

      // should be empty
      temp = await contract.gameId2Stat(0);
      expect(temp[0]).eq(ZERO_ADDRESS)
    });

    it("[2 palyers] should start new game, and player1 wins", async function() {
      // player 1 start
      await contract.connect(player1).startNewGame();
      let gameId = 1;
      expect(await contract.player2activeGameId(player1.address)).eq(gameId);
      expect(await contract.player2activeGameId(player2.address)).eq(0);
      expect(await contract.gameCnt()).eq(1);

      let gameStat = await contract.gameId2Stat(gameId);
      expect(gameStat[0]).eq(player1.address);
      expect(gameStat[1]).eq(ZERO_ADDRESS);
      expect(gameStat[2]).eq(0);

      // player 2 accepts
      await contract.connect(player2).joinGame(gameId);
      gameStat = await contract.gameId2Stat(gameId);
      expect(gameStat[0]).eq(player1.address);
      expect(gameStat[1]).eq(player2.address);
      expect(gameStat[2]).eq(0);

      if (gameStat[3]) {
        first = player1; second = player2;
      } else {
        first = player2; second = player1;
      }
      // console.log('isPlayer1First=', gameStat[3])

      // player1 make move
      await contract.connect(first).makeMove(gameId, 0, 0);
      gameStat = await contract.gameId2Stat(gameId);
      expect(gameStat[2]).eq(0);

      // player2 make move
      await contract.connect(second).makeMove(gameId, 1, 0);
      gameStat = await contract.gameId2Stat(gameId);
      expect(gameStat[2]).eq(0);

      // player1 make move
      await contract.connect(first).makeMove(gameId, 0, 1);
      gameStat = await contract.gameId2Stat(gameId);
      expect(gameStat[2]).eq(0);

      // player2 make move
      await contract.connect(second).makeMove(gameId, 1, 1);
      gameStat = await contract.gameId2Stat(gameId);
      expect(gameStat[2]).eq(0);

      // player1 make move. player1 wins now
      await contract.connect(first).makeMove(gameId, 0, 2);
      gameStat = await contract.gameId2Stat(gameId);
      expect(gameStat[2]).eq(2);
      expect(await contract.player2activeGameId(player1.address)).eq(0);
      expect(await contract.player2activeGameId(player2.address)).eq(0);
    });

    it("[2 palyers] When 1 player wins, can start a new game.", async function() {
      // player 1 start
      await contract.connect(player1).startNewGame();
      let gameId = 1;
      // player 2 accepts
      await contract.connect(player2).joinGame(gameId);

      let gameStat = await contract.gameId2Stat(gameId);
      if (gameStat[3]) {
        first = player1; second = player2;
      } else {
        first = player2; second = player1;
      }
      // console.log('isPlayer1First=', gameStat[3])

      // player1 make move
      await contract.connect(first).makeMove(gameId, 0, 0);

      // player2 make move
      await contract.connect(second).makeMove(gameId, 1, 0);

      // player1 make move
      await contract.connect(first).makeMove(gameId, 0, 1);

      // player2 make move
      await contract.connect(second).makeMove(gameId, 1, 1);

      // player1 make move. player1 wins now
      await contract.connect(first).makeMove(gameId, 0, 2);


      // after game is done, player1 can start a new game with player3
      // player 1 start gameId = 1
      await contract.connect(player1).startNewGame();
      gameId = 2;
      expect(await contract.player2activeGameId(player1.address)).eq(gameId);
      expect(await contract.gameCnt()).eq(2);

      // player 3 accepts
      await contract.connect(player3).joinGame(gameId);

      gameStat = await contract.gameId2Stat(gameId);
      if (gameStat[3]) {
        first = player1; second = player3;
      } else {
        first = player3; second = player1;
      }
      // console.log('isPlayer1First=', gameStat[3])

      // player1 make move
      await contract.connect(first).makeMove(gameId, 0, 0);

      // player3 make move
      await contract.connect(second).makeMove(gameId, 1, 0);
    });

    /**
     *    o x o
     *    x o x
     *    x o x
     */
    it("[2 palyers] When there is a tie", async function() {
      // player 1 start
      await contract.connect(player1).startNewGame();
      let gameId = 1;
      // player 2 accepts
      await contract.connect(player2).joinGame(gameId);
      let gameStat = await contract.gameId2Stat(gameId);
      if (gameStat[3]) {
        first = player1; second = player2;
      } else {
        first = player2; second = player1;
      }

      // player1 make move
      await contract.connect(first).makeMove(gameId, 0, 1);

      // player2 make move
      await contract.connect(second).makeMove(gameId, 0, 0);

      // player1 make move
      await contract.connect(first).makeMove(gameId, 1, 0);

      // player2 make move
      await contract.connect(second).makeMove(gameId, 0, 2);

      // player1 make move.
      await contract.connect(first).makeMove(gameId, 1, 2);

      // player2 make move
      await contract.connect(second).makeMove(gameId, 1, 1);

      // player1 make move.
      await contract.connect(first).makeMove(gameId, 2, 0);

      // player2 make move
      await contract.connect(second).makeMove(gameId, 2, 1);

      // player1 make move.
      await contract.connect(first).makeMove(gameId, 2, 2);

      gameStat = await contract.gameId2Stat(gameId);
      expect(gameStat.gameStatus).eq(3);
      expect(await contract.player2activeGameId(first.address)).eq(0)
      expect(await contract.player2activeGameId(second.address)).eq(0)
    });

    it("[4 palyers] should allow muliple concurrent games", async function() {
      // gameId1: player1 vs player2
      await contract.connect(player1).startNewGame();
      let gameId1 = 1, gameId2 = 2;
      // player 2 accepts
      await contract.connect(player2).joinGame(gameId1);

      // gameId2: player3 vs player4
      await contract.connect(player3).startNewGame();
      // player 4 accepts
      await contract.connect(player4).joinGame(gameId2);

      let first1, second1, first2, second2;
      let gameStat1 = await contract.gameId2Stat(gameId1);
      let gameStat2 = await contract.gameId2Stat(gameId2);

      if (gameStat1[3]) {
        first1 = player1; second1 = player2;
      } else {
        first1 = player2; second1 = player1;
      }

      if (gameStat2[3]) {
        first2 = player3; second2 = player4;
      } else {
        first2 = player4; second2 = player3;
      }

      // player1 make move
      await contract.connect(first1).makeMove(gameId1, 0, 0);

      // player2 make move
      await contract.connect(second1).makeMove(gameId1, 1, 0);

      // player3 make move
      await contract.connect(first2).makeMove(gameId2, 0, 0);

      // player4 make move
      await contract.connect(second2).makeMove(gameId2, 1, 0);

      // validation
      gameStat1 = await contract.gameId2Stat(gameId1);
      gameStat2 = await contract.gameId2Stat(gameId2);

      expect(gameStat1.player1).eq(player1.address)
      expect(gameStat1.player2).eq(player2.address)
      expect(gameStat2.player1).eq(player3.address)
      expect(gameStat2.player2).eq(player4.address)

      expect(gameStat1.gameStatus).eq(0)
      expect(gameStat2.gameStatus).eq(0)

      expect(await contract.player2activeGameId(player1.address)).eq(gameId1)
      expect(await contract.player2activeGameId(player2.address)).eq(gameId1)
      expect(await contract.player2activeGameId(player3.address)).eq(gameId2)
      expect(await contract.player2activeGameId(player4.address)).eq(gameId2)

    });

    it("[2 palyers] pause should work", async function() {
      // player 1 start
      await contract.connect(player1).startNewGame();
      let gameId = 1;
      // player 2 accepts
      await contract.connect(player2).joinGame(gameId);
      let gameStat = await contract.gameId2Stat(gameId);
      if (gameStat[3]) {
        first = player1; second = player2;
      } else {
        first = player2; second = player1;
      }

      // player1 make move
      await contract.connect(first).makeMove(gameId, 0, 1);

      // player2 make move
      await contract.connect(second).makeMove(gameId, 0, 0);

      await contract.connect(owner).setIsPaused();

      // player1 make move, should throw exception
      await expect(contract.connect(first).makeMove(gameId, 0, 1)).to.be.revertedWith("smart contract paused");
    });

    it("[2 palyers] setIsPaused should only be done by owner", async function() {
      await contract.connect(owner).setIsPaused();

      // player1 make move, should throw exception
      await expect(contract.connect(player1).setIsPaused()).to.be.revertedWith("must be owner to do this op");
    });
  });
});
