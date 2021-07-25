

const socket = io("http://localhost:3000");

let initialData = function (name, roomId) {
  this.name = name;
  this.roomId = roomId;
};

let init = new initialData("thomas", "1111");

class Player{
  constructor(id,name,roomId) {
    this.id = id;
    this.name = name;
    this.roomId = roomId;
    this.isReady = true;
  }  
}

class Lobby{
  constructor(){
    this.players= [];
  }
  addPlayer(data){
    const player = new Player(data.id,data.name,data.roomId);
    this.players.push(player)
  }
}

socket.emit("joinRoom", init);

socket.on('updatePlayers',(data)=>{
  console.log(data);
})

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

/* #region Game Class */
class Game {
  constructor() {

    // Babylon enviroment setup
    this.canvas = document.getElementById("renderCanvas");
    this.engine = new BABYLON.Engine(this.canvas, true);
    this.scene = this.createScene(this.engine, this.canvas);
    this.cars = this.createCars(this.scene, color, position);
    this.followCamera = this.createFollowCamera(this.scene,this.cars[0].mesh);
   
    
    this.engine.runRenderLoop(() => {
      this.cars[3].updateColor(color2);        
      this.scene.render();
    });
  }

  createScene() {
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.collisionsEnabled = true;
    // this.freeCamera = this.createFreeCamera(this.scene);    
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

  createFollowCamera(scene,target){
    this.camera = new BABYLON.FollowCamera('playerFollowCamera',target.position,scene,target);
    this.camera.radius = 10; // how far from the object to follow
    this.camera.heightOffset = 3 // how high above the object to place camera
    this.camera.rotationOffset = 180 // the viewing angle
    this.camera.cameraAccelatrion = 0.5 // how fast camera to move
    this.camera.maxCameraSpeed = 50; // speed limit

    return this.camera
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
    console.log(this.carMaterial);
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
    let newCarMaterial = new BABYLON.StandardMaterial("newCarMaterial", this.scene);
    newCarMaterial.diffuseColor = new BABYLON.Color3(
      color.red,
      color.blue,
      color.green
    );

    this.mesh.material = newCarMaterial;
  }
}
/* #endregion */

/* #region  Keybord Class */
class Keyboard {
  static init() {
    document.addEventListener("keydown", function (event) {
      if (event.key == "w" || event.key == "W") {
        console.log("w");
      }
      if (event.key == "s" || event.key == "S") {
        isSPressed = true;
      }
      if (event.key == "a" || event.key == "A") {
        isAPressed = true;
      }
      if (event.key == "d" || event.key == "D") {
        isDPressed = true;
      }
    });

    document.addEventListener("keyup", function (event) {
      if (event.key == "w" || event.key == "W") {
      }
      if (event.key == "s" || event.key == "S") {
        isSPressed = false;
      }
      if (event.key == "a" || event.key == "A") {
        isAPressed = false;
      }
      if (event.key == "d" || event.key == "D") {
        isDPressed = false;
      }
    });
  }
}
/* #endregion */

let game = new Game();
// Keyboard.init();

window.addEventListener("resize", game.engineResize());




