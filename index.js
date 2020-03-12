class Astar {
  constructor(params = {}) {
    const { field = [[]], rules, cost, orthogonal = false } = params;

    this.setEnums(cost);

    this.steps = 0;
    this.points = {};
    this.field = this.prepareField({ field, rules });
    this.openedList = [];
    this.closedList = [];
    this.root = [];
    this.orthogonalMode = orthogonal;
    this.running = false;
  }

  get width() {
    return this.field[0].length;
  }

  get height() {
    return this.field.length;
  }

  Manhattan({ x: x1, y: y1 }, { x: x2, y: y2 }) {
    return (Math.abs(x2 - x1) + Math.abs(y2 - y1)) * 10;
  }

  getF({ g, p }) {
    return g + this.Manhattan(p, this.points.end);
  }

  listHasPoint(list, { x, y }) {
    return list.filter(({ x: lx, y: ly }) => lx === x && ly === y).length > 0;
  }

  getRoot({ x, y }) {
    this.root.push({ x, y });

    let parent;
    let px = x;
    let py = y;

    do {
      parent = this.closedList.find(({ x, y }) => x === px && y === py).parent;
      if (parent) {
        this.root.push(parent);
        px = parent.x;
        py = parent.y;
      }
    } while (parent);

    this.root.reverse();
  }

  checkAdjacent({ x, y, g }) {
    const adjacent = this.orthogonalMode ? this.adjacentEnumOrthogonal : this.adjacentEnum;
    Object.values(adjacent).forEach(({ x: dx, y: dy }, i) => {
      const nx = x + dx;
      const ny = y + dy;
      const thisPointG = this.orthogonalMode ? this.energy.easy : i % 2 ? this.energy.hard : this.energy.easy;

      if (nx < 0 || ny < 0 || nx === this.width || ny === this.height) {
        return;
      }

      if (
        this.field[ny][nx] !== this.fieldEnum.wall &&
        !this.listHasPoint(this.openedList, { x: nx, y: ny }) &&
        !this.listHasPoint(this.closedList, { x: nx, y: ny })
      ) {
        this.openedList.push({
          x: nx,
          y: ny,
          f: this.getF({ g: g + thisPointG, p: { x: nx, y: ny } }),
          g: g + thisPointG,
          m: this.Manhattan({ x: nx, y: ny }, this.points.end),
          parent: { x, y }
        });
      } else if (this.listHasPoint(this.openedList, { x: nx, y: ny })) {
        const currentPoint = this.openedList.find(({ x, y }) => x === nx && y === ny);
        if (g + thisPointG < currentPoint.g) {
          currentPoint.g = g + thisPointG;
          currentPoint.f = currentPoint.g + currentPoint.m;
          currentPoint.parent = { x, y };
        }
      }

      if (nx === this.points.end.x && ny === this.points.end.y) {
        this.closedList.push(
          this.openedList.splice(this.openedList.findIndex(({ x, y }) => x === nx && y === ny), 1)[0]
        );
        this.getRoot({ x: nx, y: ny });
      }
    });
  }

  go({ start, end }) {
    this.points.start = start;
    this.points.end = end;
    this.openedList.push(this.points.start);
    this.setStartEnd();

    return this.step();
  }

  step() {
    this.steps += 1;

    debugger;
    const nextPointIdx = this.openedList.findIndex(({ f }) => f === Math.min(...this.openedList.map(({ f }) => f)));
    if (nextPointIdx === -1) {
      if (this.running) {
        return { route: [], steps: this.steps, message: "-- no route" };
      }

      this.running = true;
      this.closedList.push(this.openedList.pop());
      this.checkAdjacent({ ...this.closedList[this.closedList.length - 1], g: 0 });
      return this.step();
    }

    this.closedList.push(this.openedList.splice(nextPointIdx, 1)[0]);
    this.checkAdjacent(this.closedList[this.closedList.length - 1]);

    if (this.root.length === 0) {
      return this.step();
    } else {
      return { root: this.root, steps: this.steps, message: "-- ok" };
    }
  }

  setStartEnd() {
    this.field[this.points.start.y][this.points.start.x] = this.fieldEnum.start;
    this.field[this.points.end.y][this.points.end.x] = this.fieldEnum.end;
  }

  prepareField({ field, rules }) {
    const { wall, empty } = rules;

    return field.map((row, y) =>
      row.map((e, x) => {
        if (eval(e + wall)) {
          return this.fieldEnum.wall;
        } else if (eval(e + empty)) {
          return this.fieldEnum.good;
        }
      })
    );
  }

  setEnums({ easy, hard }) {
    this.adjacentEnum = {
      top: { x: 0, y: -1 },
      topRight: { x: 1, y: -1 },
      right: { x: 1, y: 0 },
      bottomRight: { x: 1, y: 1 },
      bottom: { x: 0, y: 1 },
      bottomLeft: { x: -1, y: 1 },
      left: { x: -1, y: 0 },
      topLeft: { x: -1, y: -1 }
    };
    Object.freeze(this.adjacentEnum);

    this.adjacentEnumOrthogonal = {
      top: { x: 0, y: -1 },
      right: { x: 1, y: 0 },
      bottom: { x: 0, y: 1 },
      left: { x: -1, y: 0 }
    };
    Object.freeze(this.adjacentEnumOrthogonal);

    this.energy = {
      easy,
      hard
    };
    Object.freeze(this.energy);

    this.fieldEnum = {
      start: 3,
      end: 8,
      wall: 0,
      good: 1
    };
    Object.freeze(this.fieldEnum);
  }
}

const params = {
  field: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ],
  rules: {
    wall: ">0",
    empty: "===0"
  },
  cost: { easy: 10, hard: 14 },
  orthogonal: true
};
const aStar = new Astar(params);
console.log(aStar.go({ start: { x: 0, y: 0 }, end: { x: 1, y: 0 } }));
