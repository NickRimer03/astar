export default class Astar {
  constructor(params = {}) {
    const { field = [[]], rules, cost, orthogonal = false } = params;

    this.setEnums(cost);
    this.running = false;

    this.steps = 0;
    this.points = {};
    this.openedList = [];
    this.closedList = [];
    this.route = [];
    this.orthogonalMode = orthogonal;
    this.rules = rules;

    this.update(field);
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

  getRoute({ x, y }) {
    this.route.push({ x, y });

    let parent;
    let px = x;
    let py = y;

    do {
      parent = this.closedList.find(({ x, y }) => x === px && y === py).parent;
      if (parent) {
        this.route.push(parent);
        px = parent.x;
        py = parent.y;
      }
    } while (parent);

    this.route.reverse();
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
        this.getRoute({ x: nx, y: ny });
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

    const nextPointIdx = this.openedList.findIndex(({ f }) => f === Math.min(...this.openedList.map(({ f }) => f)));
    if (nextPointIdx === -1) {
      if (this.running) {
        return this.route.length ? this.returnData("-- ok") : this.returnData("-- no route");
      }

      this.running = true;
      this.closedList.push(this.openedList.pop());
      this.checkAdjacent({ ...this.closedList[this.closedList.length - 1], g: 0 });
      return this.step();
    }

    this.closedList.push(this.openedList.splice(nextPointIdx, 1)[0]);
    this.checkAdjacent(this.closedList[this.closedList.length - 1]);

    if (this.route.length === 0) {
      return this.step();
    } else {
      return this.returnData("-- ok");
    }
  }

  returnData(message) {
    const data = { route: [...this.route], steps: this.steps, message };
    this.reset();
    return data;
  }

  reset() {
    this.running = false;
    this.openedList.length = 0;
    this.closedList.length = 0;
    this.route.length = 0;
    this.steps = 0;
  }

  update(field) {
    this.field = this.prepareField(field);
  }

  setStartEnd() {
    this.field[this.points.start.y][this.points.start.x] = this.fieldEnum.start;
    this.field[this.points.end.y][this.points.end.x] = this.fieldEnum.end;
  }

  prepareField(field) {
    const { wall, empty } = this.rules;

    return field.map(row =>
      row.map(e => {
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
