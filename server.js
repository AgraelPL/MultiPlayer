const express = require("express");
const app = express();
const server = app.listen(3000);
// const io = require('socket.io')(server);

const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    transports: ["websocket", "polling"],
  },
  allowEIO3: true,
});

const babylon = require("babylon");

app.use(express.static(__dirname + "/public"));

app.get("*", function (req, res) {
  res.send(__dirname + "/public/index.html");
});

// ------------------------------------------------------------------------------------

class Player {
  constructor(id, name, roomId, databaseId) {
    this.id = id;
    this.name = name;
    this.roomId = roomId;
    this.isReady = true;
    this.databaseId = databaseId;
  }
}
class Lobby {
  constructor() {
    this.players = {};
    this.games = {};
  }

  addNewPlayer(socketId, data) {
    const player = new Player(
      socketId,
      data.name,
      data.roomId,
      data.databaseId
    );
    return player;
  }

  deletePlayerFromGame(id) {
    try {
      delete this.games[this.players[id]].players[id];
      delete this.players[id];
    } catch (err) {
      console.log("Delete Player Error : ");
      console.log(err.msg);
    }
  }

  gameCheck(gameId, player) {
    if (this.games[gameId]) {
      this.games[gameId].players[player.id] = player;
      this.players[player.id] = player.roomId;
    } else {
      this.games[gameId] = new Game(gameId);
      this.games[gameId].players[player.id] = player;
      this.players[player.id] = player.roomId;
    }
  }

  getRoomIdFromPlayer(id) {
    try {
      return this.players[id];
    } catch (err) {
      console.log("getRoomIdFromPlayer error", err);
      console.log(err.msg);
    }
  }
  displayRoomPlayers(roomId) {
    try {
      return this.games[roomId].players;
    } catch (err) {
      console.log("displayRoomPlayers error", err);
    }
  }

  runGame(roomId) {
    let players = this.games[roomId].players;
    this.games[roomId].createGame(players);    
  }
}

/* #endregion */

/* #region Game Class */
class Game {
  constructor(id) {
    this.id = id;
    this.players = {};
  }

  createGame(players) {
    this.engine = new BABYLON.NullEngine();
    this.scene = this.createScene(this.engine);
    this.cars = this.createCars(this.scene, players);
    // console.log(this.cars[0].position);
    this.engine.runRenderLoop(() => {      
      this.scene.render();
    });
  }

  sendDataToClient() {}

  createScene() {
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.collisionsEnabled = true;
    this.freeCamera = this.createFreeCamera(this.scene);
    this.createLight(this.scene);

    return this.scene;
  }

  createFreeCamera(scene, canvas) {
    this.camera = new BABYLON.FreeCamera(
      "freeCamera",
      new BABYLON.Vector3(0, 0, 0),
      scene
    );
    this.camera.attachControl(canvas);
    this.camera.position.y = 10;
    this.camera.position.z = 10;
    this.camera.position.x = 10;

    this.camera.checkCollisions = true;
    //camera.applyGravity = true;
    this.camera.keysUp.push("w".charCodeAt(0));
    this.camera.keysUp.push("W".charCodeAt(0));
    this.camera.keysDown.push("s".charCodeAt(0));
    this.camera.keysDown.push("S".charCodeAt(0));
    this.camera.keysLeft.push("a".charCodeAt(0));
    this.camera.keysLeft.push("A".charCodeAt(0));
    this.camera.keysRight.push("d".charCodeAt(0));
    this.camera.keysRight.push("D".charCodeAt(0));

    return this.camera;
  }

  createLight(scene) {
    let ligh0 = new BABYLON.DirectionalLight(
      "dir0",
      new BABYLON.Vector3(-0.1, -1, 0),
      scene
    );
    let light1 = new BABYLON.DirectionalLight(
      "dir1",
      new BABYLON.Vector3(-1, -1, 0),
      scene
    );
  }

  createCars(scene, players) {
    let cars = [];
    let positionX = -5;
    for (const [key, value] of Object.entries(players)) {
      let car = new Car(scene, value);
      car.mesh.position.x = positionX;       
      cars.push(car);
      positionX +=5;
    }
    return cars;
  }

  // getAllCars(){
  //   console.log(this.scene)
  // }

  engineResize() {
    this.engine.resize();
  }
}
/* #endregion */

/* #region Car Class */
class Car {
  constructor(scene, player) {
    this.mesh = new BABYLON.MeshBuilder.CreateBox(
      player.id,
      {
        height: 0.5,
        depth: 1,
        width: 1,
      },
      scene
    );
    this.mesh.metadata = {};
    this.mesh.metadata.vehicle = true;
    this.mesh.metadata.isReady = player.isReady;
    this.carMaterial = new BABYLON.StandardMaterial("carMaterial", scene);
    this.carMaterial.diffuseColor = new BABYLON.Color3(255, 0, 0);
    this.mesh.material = this.carMaterial;
    this.mesh.speed = 2;
    this.mesh.rotationSpeed = 0.04;
    this.mesh.frontVector = new BABYLON.Vector3(0, 0, 1);
  }

  updatePosition() {
    if (this.state.isWPressed) {
      this.mesh.moveWithCollisions(
        this.mesh.frontVector.multiplyByFloats(
          1 * this.mesh.speed,
          1 * this.mesh.speed,
          1 * this.mesh.speed
        )
      );
      console.log(this.mesh.position);
    }
  }

  updateColor(color) {
    let newCarMaterial = new BABYLON.StandardMaterial(
      "newCarMaterial",
      this.scene
    );
    newCarMaterial.diffuseColor = new BABYLON.Color3(
      color.red,
      color.blue,
      color.green
    );

    this.mesh.material = newCarMaterial;
  }
}
/* #endregion */

let lobby = new Lobby();

io.on("connection", connected);

function connected(socket) {
  socket.on("joinRoom", (init) => {
    const player = lobby.addNewPlayer(socket.id, init);
    lobby.gameCheck(init.roomId, player);
    socket.join(player.roomId);
    io.to(player.roomId).emit(
      "updatePlayers",
      lobby.displayRoomPlayers(player.roomId)
    );
  });

  socket.on("ready", () => {
    let room = lobby.getRoomIdFromPlayer(socket.id);
    lobby.runGame(room);   
    io.to(room).emit("ready",lobby.displayRoomPlayers(room));
  
  });

  socket.on("disconnect", () => {
    let room = lobby.getRoomIdFromPlayer(socket.id);
    lobby.deletePlayerFromGame(socket.id);
    io.to(room).emit("updatePlayers", lobby.displayRoomPlayers(room));
  });
}
