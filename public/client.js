const socket = io("http://localhost:3000");

let initialData = function (name, roomId, databaseId) {
  this.name = name;
  this.roomId = roomId;
  this.databaseId = databaseId;
};

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let randomNumber = randomInteger(100, 500);

let init = new initialData("thomas", "1111", randomNumber);

class Player {
  constructor(id, name, roomId, databaseId, enabled) {
    this.id = id;
    this.name = name;
    this.roomId = roomId;
    this.enabled = enabled;
    this.databaseId = databaseId;
    this.isReady = true;
  }
}

class Lobby {
  constructor() {
    this.players = {};
    this.game;
  }

  gameStart(players) {
    this.game = new Game(players);
  }

  updatePlayers(data) {
    let arr = {};
    for (const [key, value] of Object.entries(data)) {
      let database = "";
      let enabled = false;
      if (value.databaseId === init.databaseId) {
        database = value.databaseId;
        enabled = true;
      } else {
        database = "another player";
      }
      let player = new Player(key, value.name, value.roomId, database, enabled);
      arr[player.id] = player;
    }
    this.players = arr;
    console.log(this.players);
  }
}

socket.emit("joinRoom", init);
socket.on("updatePlayers", (data) => {
  lobby.updatePlayers(data);
});

socket.on("ready", (players) => {
  lobby.gameStart(lobby.players);
});

/* #region Game Class */
class Game {
  constructor(players) {
    this.canvas = document.getElementById("renderCanvas");
    this.engine = new BABYLON.Engine(this.canvas, true);
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.collisionsEnabled = true;
    this.cars = this.createCars(this.scene, players);
    // this.freeCamera = this.createFreeCamera(this.scene);

    this.createLight(this.scene);
    this.createFollowCamera(this.scene, players);

    //this.followCamera = this.createFollowCamera(this.scene, this.cars[0].mesh);
    // this.freeCamera = this.createFreeCamera(this.scene, this.canvas);

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  createFollowCamera(scene, players) {
    let targetPlayer;
    console.log(this.cars);
    for (const [key, value] of Object.entries(players)) {
      if (value.enabled === true) {
        targetPlayer = key;
      }
    }
    this.camera = new BABYLON.FollowCamera(
      "playerCamera",
      this.cars[targetPlayer].mesh.position,
      scene,
      this.cars[targetPlayer].mesh
    );
    this.camera.radius = 10; // how far from the object to follow
    this.camera.heightOffset = 3; // how high above the object to place camera
    this.camera.rotationOffset = 180; // the viewing angle
    this.camera.cameraAccelatrion = 0.5; // how fast camera to move
    this.camera.maxCameraSpeed = 50; // speed limit

    return this.camera;
  }

  /* #region  follow camera */
  // createFollowCamera(scene, target) {
  //   this.camera = new BABYLON.FollowCamera(
  //     "playerFollowCamera",
  //     target.position,
  //     scene,
  //     target
  //   );
  //   this.camera.radius = 10; // how far from the object to follow
  //   this.camera.heightOffset = 3; // how high above the object to place camera
  //   this.camera.rotationOffset = 180; // the viewing angle
  //   this.camera.cameraAccelatrion = 0.5; // how fast camera to move
  //   this.camera.maxCameraSpeed = 50; // speed limit

  //   return this.camera;
  // }
  /* #endregion */

  /* #region  free camera */
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
  /* #endregion */

  /* #region  light */
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
  /* #endregion */

  /* #region  cars */
  createCars(scene, players) {
    let cars = {};
    let positionX = -5;
    for (const [key, value] of Object.entries(players)) {
      let car = new Car(scene, value);
      car.mesh.position.x = positionX;
      cars[key] = car;
      positionX += 5;
    }
    return cars;
  }
  /* #endregion */

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
    this.carMaterial = new BABYLON.StandardMaterial("carMaterial", scene);

    this.carMaterial.diffuseColor = new BABYLON.Color3(255, 0, 0);
    this.mesh.material = this.carMaterial;
    this.mesh.speed = 2;
    this.mesh.rotationSpeed = 0.04;
  }

  /* #region  updateColor */
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
  /* #endregion */
}
/* #endregion */

/* #region  Keybord Class */

// class Keyboard {
//   constructor() {
//     this.isWPressed = false;
//     this.isSPressed = false;
//     this.isAPressed = false;
//     this.isDPressed = false;
//   }
// }

/* #endregion */

let lobby = new Lobby();

// let keyboard = new Keyboard();
/* #region  keyup/down listeners */

// document.addEventListener("keydown", function (event) {
//   if (event.key == "w" || event.key == "W") {
//     keyboard.isWPressed = true;
//   }
//   if (event.key == "s" || event.key == "S") {
//     keyboard.isSPressed = true;
//   }
//   if (event.key == "a" || event.key == "A") {
//     keyboard.isAPressed = true;
//   }
//   if (event.key == "d" || event.key == "D") {
//     keyboard.isDPressed = true;
//   }
// });

// document.addEventListener("keyup", function (event) {
//   if (event.key == "w" || event.key == "W") {
//     keyboard.isWPressed = false;
//   }
//   if (event.key == "s" || event.key == "S") {
//     keyboard.isSPressed = false;
//   }
//   if (event.key == "a" || event.key == "A") {
//     keyboard.isAPressed = false;
//   }
//   if (event.key == "d" || event.key == "D") {
//     keyboard.isDPressed = false;
//   }
// });
/* #endregion */

let createBtn = document.getElementById("createGame");

createBtn.addEventListener("click", () => {
  socket.emit("ready");
});

window.addEventListener("resize", lobby.game.engineResize());
