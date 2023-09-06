//---------------------------------------------------------
// MAZE Generator (Generador de LABERINTOS)  By Juan Eguia
//---------------------------------------------------------
let tiles = prompt('Elige el tamaño de una cuadricula (8 - 100');
let canvas = document.createElement('canvas');
canvas.setAttribute('width', '400');
canvas.setAttribute('height', '400');
canvas.setAttribute('id', 'canvas');
canvas.style.border = '2px solid black';
document.body.appendChild(canvas);
let ctx = canvas.getContext('2d');

let FPS = 60;
let TX = parseInt(tiles);
let TY = parseInt(tiles);

let FILAS = parseInt(canvas.height / TY);
let COLUMNAS = parseInt(canvas.width / TX);

const verdeVISITADA = 'rgba(0,255,0,0.5)';
const rojoCURSOR = 'rgba(255,0,0,0.8)';
const negroPARED = 'black';

const rojoClosedSet = 'rgba(255,50,10,0.8)';
const verdeOpenSet = 'rgba(190,255,10,0.5)';
const azulClaroCamino = 'rgba(10,180,255,0.5)';
const amarillo = '#CCEE00';
const rojoSprite = '#EE3010';

// -------------- Relativo al Algoritmo MazeGenerator ------
let terminado = false;

let stack = [];
let casillas = [];

// -------------- Relativo al Algoritmo A* Pathfinder ------
let principio;
let fin;

let openSet = [];
let closedSet = [];

let camino = [];
let terminadoA = false;
let comenzarA = false;

let sprite;
let caminoSprite = [];

//==========================================================
class Casilla {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.corners = [
	      { x: x * TX, y: y * TY },
	      { x: x * TX + TX, y: y * TY },
	      { x: x * TX + TX, y: y * TY + TY },
	      { x: x * TX, y: y * TY + TY },
	      { x: x * TX, y: y * TY },
	    ];
	    // (Orden): Top, right, bottom, left
		this.walls = [true, true, true, true];
		this.visitada = false;

		this.f = 0;		// g + h
		this.g = 0;		// Pasos dados
		this.h = 0;		// Heuristica (estimacion distancia hasta destino)

		this.vecinos = [];
		this.padre = null;
	}

	render() {
	    for (let i = 0; i < 4; i++) {
	      if (this.walls[i])
	        dibujaLineaBorde(this.corners[i].x, this.corners[i].y, 
	        	this.corners[i + 1].x, this.corners[i + 1].y);
	    }

	    if (this.visitada) {
	      ctx.fillStyle = verdeVISITADA;
	      ctx.fillRect(this.x * TX, this.y * TY, TX, TY);
	    }
	}

	checkVecinos() {
		let x = this.x;
		let y = this.y;
		let posVecinos = [
			{ x: x, y: y - 1 },
			{ x: x + 1, y: y },
			{ x: x, y: y + 1 },
			{ x: x - 1, y: y }
		];

		let vecinos = [];

		for (let i = 0; i < posVecinos.length; i ++) {
			let vecinoBajoCheckeo = casillas[indice(posVecinos[i].x, posVecinos[i].y)];

			if (vecinoBajoCheckeo && !vecinoBajoCheckeo.visitada) {
				vecinos.push(vecinoBajoCheckeo);
			}
		}

		if (vecinos.length > 0) {
			let num_rnd = Math.floor(Math.random() * vecinos.length);
			return vecinos[num_rnd];
		}

		return undefined;
	}

	cursor() {
		ctx.fillStyle = rojoCURSOR;
		ctx.fillRect(this.x * TX, this.y * TY, TX, TY);
	}

	// METODO QUE CALCULA SUS VECINOS
	addVecinos(x, y, i) {
		if (x > 0) this.vecinos.push(casillas[i - 1]);
		if (x < COLUMNAS - 1) this.vecinos.push(casillas[i + 1]);
		if (y > 0) this.vecinos.push(casillas[i - COLUMNAS]);
		if (y < FILAS - 1) this.vecinos.push(casillas[i + COLUMNAS]);
	}

	//MÉTODO QUE DIBUJA OpenSET
	dibujaOS() {
		ctx.fillStyle = verdeOpenSet;
		ctx.fillRect(this.x * TX + 1, this.y * TY + 1, TX - 1, TY - 1);
	}

	//MÉTODO QUE DIBUJA ClosedSET
	dibujaCS() {
		ctx.fillStyle = rojoClosedSet;
		ctx.fillRect(this.x * TX + 1, this.y * TY + 1, TX - 1, TY - 1);
	}

	//MÉTODO QUE DIBUJA EL CAMINO
	dibujaCamino() {
		ctx.fillStyle = azulClaroCamino;
		ctx.fillRect(this.x * TX + 1, this.y * TY + 1, TX - 1, TY - 1);
	}
}

//=======================================================
class Sprite {
	constructor(x, y, velXY) {
		this.inicialX = x * TX + parseInt(TX / 2);
		this.inicialY = y * TY + parseInt(TY / 2);
		this.x = this.inicialX;
		this.y = this.inicialY;

		this.ancho = parseInt(TX / 2);
		this.alto = parseInt(TY / 2);
		this.radio = parseInt(this.alto / 2);

		this.indiceCamino = 0;
		this.contadorXY = 0;
		this.velXY = velXY;
		this.velXY_inicial = velXY;
		this.vel = parseInt(TY / 10);

		if (TY < 200) this.vel = TY;
	}

	dibuja() {
		// this.actualiza();
		// ctx.fillStyle = rojoSprite;
		// ctx.fillRect(this.x * TILE_X + parseInt(TILE_X / 2), 
		// 	this.y * TILE_Y + parseInt(TILE_Y / 2), this.ancho, this.alto);

		ctx.fillStyle = 'black';
		ctx.fillRect(principio.x, principio.y, TX, TY);
		ctx.fillRect(fin.x * TX, fin.y * TY, TX, TY);

		ctx.beginPath();
		ctx.arc(this.x * TX + parseInt(TX / 2), 
			this.y * TY + parseInt(TY / 2), this.radio, 0, Math.PI * 2);
		ctx.fillStyle = rojoSprite;
		ctx.fill();
		ctx.closePath();
	}

	actualiza() {
		this.x = caminoSprite[this.indiceCamino].x;
		this.y = caminoSprite[this.indiceCamino].y;

		this.indiceCamino ++;

		if (this.indiceCamino >= caminoSprite.length) this.indiceCamino = 0;
	}
}

//===================================================
// FUNCIONES relativas a: algoritmo GENERA LABERINTO
//---------------------------------------------------
function abrirCamino(actual, elegida) {
	let lr = actual.x - elegida.x;

	if (lr === -1) {
		actual.walls[1] = false;
		elegida.walls[3] = false;

	} else if (lr === 1) {
		actual.walls[3] = false;
		elegida.walls[1] = false;
	}

	let tb = actual.y - elegida.y;

	if (tb === -1) {
		actual.walls[2] = false;
		elegida.walls[0] = false;

	} else if (tb === 1) {
		actual.walls[0] = false;
		elegida.walls[2] = false;
	}	
}

function dibujaLineaBorde(x1, y1, x2, y2) {
	ctx.strokeStyle = 'black';
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
}

function indice(x, y) {
	if (x < 0 || y < 0 || x > COLUMNAS - 1 || y > FILAS - 1) {
		return -1;
	}

	return y * COLUMNAS + x;
}

function creaArrayObjetosCasilla() {
	for (let i = 0; i < FILAS; i ++) {
		for (let ii = 0; ii < COLUMNAS; ii ++) {
			let casilla = new Casilla(ii, i);
			casillas.push(casilla);
		}
	}
}

function dibujaTextos() {
	ctx.font = '48px seriff';
	ctx.fillStyle = 'orangered';
	ctx.fillText(' Laberinto Creado! ', 20, parseInt(canvas.height / 2));
}

function renderLaberinto() {
	for (let i = 0; i < casillas.length; i ++) {
		casillas[i].render();
	}
}

//--------------------------------------------------
// FUNCIONES relativas a: algoritmo A* (Pathfinder)
//--------------------------------------------------
function heuristica(a, b) {
	console.log(a, b);
	let x = Math.abs(a.x - b.x);
	let y = Math.abs(a.y - b.y);

	// Distancia = x + y
	return x + y;
}

function borraDelArray(array, elemento) {
	for (let i = array.length; i >= 0; i --) {
		if (array[i] == elemento) {
			array.splice(i, 1);
		}
	}
}

function agregarVecinos() {
	let contador = 0;
	for (let i = 0; i < FILAS; i ++) {
		for (let ii = 0; ii < COLUMNAS; ii ++) {
			casillas[contador].addVecinos(ii, i, contador)
			contador ++;
		}
	}

	principio = casillas[0];
	fin = casillas[contador - 1];

	openSet.push(principio);
	comenzarA = true;
}

function comprobarParedes(actual, vecino) {
	if (actual.y == vecino.y) {
		if (actual.x < vecino.x) {
			if (!actual.walls[1] && !vecino.walls[3]) {
				return false;
			} else {
				return true;
			}

		} else {
			if (!actual.walls[3] && !vecino.walls[1]) {
				return false;
			} else {
				return true;
			}
		}
	}

	if (actual.x == vecino.x) {
		if (actual.y < vecino.y) {
			if (!actual.walls[2] && !vecino.walls[0]) {
				return false;
			} else {
				return true;
			}

		} else {
			if (!actual.walls[0] && !vecino.walls[2]) {
				return false;
			} else {
				return true;
			}
		}
	}

	console.log('Error pared');
	return true;
}

function dibujaOSCSCamino() {
	if (!terminadoA) {
		//DIBUJA OPENSET
		for (let i = 0; i < openSet.length; i++) {
			openSet[i].dibujaOS();
		}

		//DIBUJA CLOSEDSET
		for (let i = 0; i < closedSet.length; i++) {
			closedSet[i].dibujaCS();
		}

		for (let i = 0; i < camino.length; i++) {
			camino[i].dibujaCamino();
		}
	}
}

function instanciaSprite() {
	for (let i = camino.length - 1; i >= 0; i --) {
		let casillaCamino = camino[i];
		caminoSprite.push(casillaCamino);
	}

	let nextX = caminoSprite[1].x;
	let nextY = caminoSprite[1].y;

	let velXY = haciaDondeXY(nextX, nextY, caminoSprite[0].x, caminoSprite[0].y);

	sprite = new Sprite(caminoSprite[0].x, caminoSprite[0].y, velXY);
}

function haciaDondeXY(nextX, nextY, x, y) {
	
	if (nextX > x) {
		let velXY = [1, 0];
		return velXY;
	} else if (nextX < x) {
		let velXY = [-1, 0];
		return velXY;
	} else if (nextY > y) {
		let velXY = [0, 1];
		return velXY;
	} else if (nextY < y) {
		let velXY = [0, -1];
		return velXY;
	}

	console.log('error direccion');
	return [0, 0];
}

//====================================================
// ALGORITMO A* (PathFinder)
//----------------------------------------------------
function algoritmo() {
	if (!terminadoA && comenzarA) {
		if (openSet.length > 0) {
			let ganador = 0;	// Indice en el Array, de la casilla 'Ganadora'

			// Evaluamos que OpenSet tiene un MENOR coste/esfuerzo...
			for (let i = 0; i < openSet.length; i ++) {
				if (openSet[i].f < openSet[ganador].f) {
					ganador = i;
				}
			}

			// ANALIZAMOS la CASILLA 'Ganadora'...
			let actual = openSet[ganador];

			// SI hemos llegado al FINAL, BUSCAMOS el CAMINO DE VUELTA (hacia ATRAS)
			if (actual === fin) {
				let temporal = actual;
				camino.push(temporal);

				while (temporal.padre != null) {
					temporal = temporal.padre;
					camino.push(temporal);
				}

				console.log('Camino Encontrado! (sprite instanciado)');
				terminadoA = true;
				instanciaSprite();

			} else {
				borraDelArray(openSet, actual);
				closedSet.push(actual);

				let vecinos = actual.vecinos;

				// RECORREMOS los VECINOS de la casilla 'Ganadora'...
				for (let i = 0; i < vecinos.length; i ++) {
					let vecino = vecinos[i];

					// SI el VECINO NO esta en CLOSEDSET y NO es una PARED...
					let pared = comprobarParedes(actual, vecino);

					if (!closedSet.includes(vecino) && !pared) {
						let tempG = actual.g + 1;

						//SI el VECINO ya esta en OPENSET y su PESO es MAYOR...
						if (openSet.includes(vecino)) {
							if (tempG < vecino.g) {
								vecino.g = tempG;	// Camino mas corto
							}

						} else {
							vecino.g = tempG;
							openSet.push(vecino);
						}

						// ACTUALIZAMOS el RESTO de VALORES...
						vecino.h = heuristica(vecino, fin);
						vecino.f = vecino.g + vecino.h;
						vecino.padre = actual;
					}
				}
			}

		} else {
			console.log('No hay camino posible...');
			terminadoA = true;
		}
	}
}

//===================================================
// COMIENZO (Generar Laberinto)
//---------------------------------------------------
creaArrayObjetosCasilla();

let elegida;
let actual = casillas[0];
actual.visitada = true;
stack.push(actual);

function laberintoGenerandose() {
	if (comenzarA) return;

	if (stack.length > 0) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		actual = stack.pop();
		elegida = actual.checkVecinos();

		if (elegida) {
			elegida.cursor();
			stack.push(actual);
			abrirCamino(actual, elegida);
			elegida.visitada = true;
			stack.push(elegida);

		} else {
			actual.cursor();
		}

		renderLaberinto();

	} else {
		dibujaTextos();
		agregarVecinos();
		terminado = true;
	}
}

//===================================================
function buclePathFinder() {
	if (terminadoA) {
		renderLaberinto();
		sprite.dibuja();
	}
	
	algoritmo();
	dibujaOSCSCamino();
}

//---------------------------------------------------
// INTERVALOS:
// 				1. Bucle Laberinto Generandose
//				2. Bucle PathFinder A*
//				3. Bucle Sprite recorriendo
//---------------------------------------------------
setInterval(laberintoGenerandose, 1000 / FPS);
setInterval(buclePathFinder, 1000 / FPS);

setInterval(() => {
	if (terminadoA) sprite.actualiza();
}, 50);

document.addEventListener('click', (event) => {
	console.log(event.target.id);

	if (event.target.id === 'canvas' && terminadoA) {
		location.reload();
	}
});



