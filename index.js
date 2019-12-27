function draw() {
  field.forEach((row, y) => {
    row.forEach((cell, x) => {
      let div = document.querySelector(`div.cell._x${x}._y${y}`);

      if (div === null) {
        div = document.createElement("div");
        div.className = `cell _${cell} _x${x} _y${y}`;
        div.style.left = `${x * dim}px`;
        div.style.top = `${y * dim}px`;

        const coords = document.createElement("div");
        coords.className = "coords";
        coords.innerText = `(${x}; ${y})`;
        div.appendChild(coords);
      }

      const openFind = openedList.find(({ x: lx, y: ly }) => x === lx && y === ly);
      const closeFind = closedList.find(({ x: lx, y: ly }) => x === lx && y === ly);
      const rootFind = root.find(({ x: rx, y: ry }) => x === rx && y === ry);
      if (openFind || closeFind) {
        let f, g, m;

        if (openFind) {
          div.classList.add("opened");
          f = openFind.f;
          g = openFind.g;
          m = openFind.m;
        } else if (closeFind) {
          div.classList.add("closed");
          f = closeFind.f;
          g = closeFind.g;
          m = closeFind.m;
        }
        if (rootFind) {
          div.classList.add("root");
        }

        let divf = div.querySelector(".divf");
        if (divf === null) {
          divf = document.createElement("div");
          divf.className = "divf";
          div.appendChild(divf);
        }
        divf.innerText = f || "";

        let divg = div.querySelector(".divg");
        if (divg === null) {
          divg = document.createElement("div");
          divg.className = "divg";
          div.appendChild(divg);
        }
        divg.innerText = g || "";

        let divm = div.querySelector(".divm");
        if (divm === null) {
          divm = document.createElement("div");
          divm.className = "divm";
          div.appendChild(divm);
        }
        divm.innerText = m || "";
      }

      fieldDom.appendChild(div);
    });
  });
}

function listContainsPoint(list, { x, y }) {
  return list.filter(({ x: lx, y: ly }) => lx === x && ly === y).length > 0;
}

function checkAdjacent({ x, y, g }) {
  Object.values(orthogonalMode ? adjacentEnumOrthogonal : adjacentEnum).forEach(({ x: dx, y: dy }, i) => {
    const nx = x + dx;
    const ny = y + dy;
    const thisPointG = orthogonalMode ? energy.easy : i % 2 ? energy.hard : energy.easy;

    if (nx < 0 || ny < 0 || nx === width || ny === height) {
      return;
    }

    if (
      field[ny][nx] !== fieldEnum.wall &&
      !listContainsPoint(openedList, { x: nx, y: ny }) &&
      !listContainsPoint(closedList, { x: nx, y: ny })
    ) {
      openedList.push({
        x: nx,
        y: ny,
        f: returnF({ g: g + thisPointG, p: { x: nx, y: ny } }),
        g: g + thisPointG,
        m: Manhattan({ x: nx, y: ny }, points.end),
        parent: { x, y }
      });
    } else if (listContainsPoint(openedList, { x: nx, y: ny })) {
      const currentPoint = openedList.find(({ x, y }) => x === nx && y === ny);
      if (g + thisPointG < currentPoint.g) {
        currentPoint.g = g + thisPointG;
        currentPoint.f = currentPoint.g + currentPoint.m;
        currentPoint.parent = { x, y };
      }
    }

    if (nx === points.end.x && ny === points.end.y) {
      closedList.push(openedList.splice(openedList.findIndex(({ x, y }) => x === nx && y === ny), 1)[0]);
      getRoot(nx, ny);
    }
  });
}

function returnF({ g, p }) {
  return g + Manhattan(p, points.end);
}

function Manhattan({ x: x1, y: y1 }, { x: x2, y: y2 }) {
  return (Math.abs(x2 - x1) + Math.abs(y2 - y1)) * 10;
}

function getRoot(x, y) {
  root.push({ x, y });

  let parent;
  let px = x;
  let py = y;

  do {
    parent = closedList.find(({ x, y }) => x === px && y === py).parent;
    if (parent) {
      root.push(parent);
      px = parent.x;
      py = parent.y;
    }
  } while (parent);

  root.reverse();
}

const width = 10;
const height = 10;
const energy = {
  easy: 10,
  hard: 14
};
Object.freeze(energy);

const fieldEnum = {
  start: 3,
  end: 8,
  wall: 0,
  good: 1
};
Object.freeze(fieldEnum);

const adjacentEnum = {
  top: { x: 0, y: -1 },
  topRight: { x: 1, y: -1 },
  right: { x: 1, y: 0 },
  bottomRight: { x: 1, y: 1 },
  bottom: { x: 0, y: 1 },
  bottomLeft: { x: -1, y: 1 },
  left: { x: -1, y: 0 },
  topLeft: { x: -1, y: -1 }
};
Object.freeze(adjacentEnum);

const adjacentEnumOrthogonal = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 }
};
Object.freeze(adjacentEnumOrthogonal);

const points = {
  start: { x: 0, y: 0, g: 0 },
  end: { x: 9, y: 9 },
  wall: [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 8, y: 8 }, { x: 9, y: 8 }]
};

let inProcess = false;
let steps = 1;
let timeout = 50;
let orthogonalMode = false;
let dim = 64;
const openedList = [points.start];
const closedList = [];
const root = [];

const field = new Array(height).fill(0).map(() => new Array(width).fill(fieldEnum.good));
field[points.start.y][points.start.x] = fieldEnum.start;
field[points.end.y][points.end.x] = fieldEnum.end;
points.wall.forEach(({ x, y }) => {
  field[y][x] = fieldEnum.wall;
});

const fieldDom = document.getElementById("field");
const btnStart = document.getElementById("btnStart");
const btnReset = document.getElementById("btnReset");
const btnClearWalls = document.getElementById("btnClearWalls");
const fieldset = document.getElementById("fieldset");
const chkOrthogonal = document.getElementById("chkOrthogonal");
const chkNoAnimation = document.getElementById("chkNoAnimation");
const txtTimeout = document.getElementById("txtTimeout");
const stepsText = document.getElementById("steps");
const noMovesText = document.getElementById("no-moves");

fieldDom.style.width = `${width * dim}px`;
fieldDom.style.height = `${height * dim}px`;

fieldset.style.width = `${width * dim}px`;

chkNoAnimation.onchange = () => {
  txtTimeout.disabled = chkNoAnimation.checked;
};

btnStart.onclick = () => {
  inProcess = true;
  fieldset.disabled = true;
  btnStart.disabled = true;
  btnClearWalls.disabled = true;
  orthogonalMode = chkOrthogonal.checked;
  timeout = Math.abs(+txtTimeout.value) || 50;
  txtTimeout.value = timeout;

  if (chkNoAnimation.checked) {
    closedList.push(openedList.pop());
    checkAdjacent(closedList[closedList.length - 1]);
    stepsText.innerText = `Steps: ${steps}`;
    draw();
    step();
  } else {
    setTimeout(() => {
      closedList.push(openedList.pop());
      checkAdjacent(closedList[closedList.length - 1]);
      stepsText.innerText = `Steps: ${steps}`;

      draw();

      setTimeout(step, timeout);
    }, timeout);
  }
};

btnReset.onclick = () => {
  btnReset.disabled = true;
  stepsText.innerText = "Steps: 0";
  noMovesText.style.display = "none";

  openedList.length = 0;
  openedList.push(points.start);
  closedList.length = 0;
  root.length = 0;
  steps = 1;

  cellsDom.forEach(cell => {
    cell.classList.remove("opened");
    cell.classList.remove("closed");
    cell.classList.remove("root");

    while (cell.children.length > 1) {
      cell.removeChild(cell.children[cell.children.length - 1]);
    }
  });

  btnStart.disabled = false;
  btnClearWalls.disabled = false;
};

btnClearWalls.onclick = () => {
  field.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (cell === fieldEnum.wall) {
        field[y][x] = fieldEnum.good;
      }
    })
  );
  document.querySelectorAll(`.cell._${fieldEnum.wall}`).forEach(cell => {
    cell.classList.remove(`_${fieldEnum.wall}`);
    cell.classList.add(`_${fieldEnum.good}`);
  });
};

draw();

const cellsDom = document.querySelectorAll(".cell");
cellsDom.forEach(cell => {
  cell.onclick = () => {
    if (inProcess) {
      console.log("-- in process");
      return;
    }

    const type = +cell.className.match(/_(\d+)/)[1];
    const x = +cell.className.match(/_x(\d+)/)[1];
    const y = +cell.className.match(/_y(\d+)/)[1];

    if ([fieldEnum.start, fieldEnum.end].includes(type)) {
      return;
    }

    if (type === fieldEnum.wall) {
      field[y][x] = fieldEnum.good;
      cell.classList.remove(`_${type}`);
      cell.classList.add(`_${fieldEnum.good}`);
    } else if (type === fieldEnum.good) {
      field[y][x] = fieldEnum.wall;
      cell.classList.remove(`_${type}`);
      cell.classList.add(`_${fieldEnum.wall}`);
    }
  };
});

function step() {
  const nextPointIdx = openedList.findIndex(({ f }) => f === Math.min(...openedList.map(({ f }) => f)));
  if (nextPointIdx === -1) {
    noMovesText.style.display = "block";
    fieldset.disabled = false;
    btnReset.disabled = false;
    inProcess = false;
    return;
  }
  closedList.push(openedList.splice(nextPointIdx, 1)[0]);
  checkAdjacent(closedList[closedList.length - 1]);
  steps += 1;
  stepsText.innerText = `Steps: ${steps}`;

  draw();

  if (root.length === 0) {
    if (chkNoAnimation.checked) {
      step();
    } else {
      setTimeout(step, timeout);
    }
  } else {
    fieldset.disabled = false;
    btnReset.disabled = false;
    inProcess = false;
  }
}
