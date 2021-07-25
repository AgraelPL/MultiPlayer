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
  constructor(id, name, roomId) {
    this.id = id;
    this.name = name;
    this.roomId = roomId;
    this.isReady = true;
  }
}

class Lobby {
  constructor() {
    // this.players = [];
    this.games = [];
  }

  checkGames(data) {
    let gameIndex = this.games.findIndex((obj) => (obj.id = data.roomId));
    if (gameIndex === -1) {
      this.game = new Game(data.roomId);
      // this.addPlayerToGame(data, this.game);
      this.games.push(this.game);
      console.log(this.games[0])
    }
  }

  addPlayerToGame(data, game) {
    const player = new Player(data.id, data.name, data.roomId);
    console.log(data);
  }

  displayAllPlayers(data) {
    let gameIndex = this.games.findIndex((obj) => (obj.id = data.roomId));
    
    return this.games[0].players;
    
  }
}

/* #region  datas */
let position = {
  x: 5,
  y: 5,
  z: 5,
};

let color = {
  red: 255,
  green: 0,
  b: 0,
};

let color2 = {
  red: 100,
  green: 100,
  b: 0,
};
/* #endregion */

/* #region Game Class */
class Game {
  constructor(id) {
    this.id = id;
    this.players = [];  
    
  }

  createGame(){
    this.engine = new BABYLON.NullEngine();
    this.scene = this.createScene(this.engine);
    this.cars = this.createCars(this.scene, color, position);
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

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

  createCars(scene, color, position) {
    let cars = [];
    let positionX = 0;
    for (let i = 0; i < 4; i++) {
      const car = new Car(scene, color, position);
      car.mesh.position.x = positionX;
      positionX += 5;
      cars.push(car);
    }
    return cars;
  }

  engineResize() {
    this.engine.resize();
  }
}
/* #endregion */

/* #region Car Class */
class Car {
  constructor(scene, color, position) {
    this.id = "sockedId";
    this.mesh = new BABYLON.MeshBuilder.CreateBox(
      "car",
      {
        height: 0.5,
        depth: 1,
        width: 1,
      },
      scene
    );
    this.mesh.metadata = {};
    this.mesh.metadata.value = 5;
    this.carMaterial = new BABYLON.StandardMaterial("carMaterial", scene);
    this.carMaterial.diffuseColor = new BABYLON.Color3(
      color.red,
      color.blue,
      color.green
    );
    this.mesh.material = this.carMaterial;
    this.mesh.position.x = position.x;
    this.mesh.position.y = position.y;
    this.mesh.position.z = position.z;
    this.mesh.speed = 2;
    this.mesh.rotationSpeed = 0.04;
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
  socket.on('joinRoom',(data)=>{
    let player = new Player(socket.id,data.name,data.roomId);
    lobby.checkGames(player.roomId);
   
  })

  

  socket.on("disconnected", () => {});
}
