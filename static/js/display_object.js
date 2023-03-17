const gridLength = 5
const tileSize = 50

var grid = []
var twoDmap = []
var oneDmap = []

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  easycam = createEasyCam();
  easycam.setRotationConstraint(false,false,false);

  for (i=0;i<gridLength;i++) {
    //oneDmap.push([Math.round(Math.random())])
    oneDmap.push([1])
  }
  for (i=0;i<gridLength;i++) {
    twoDmap.push(oneDmap)
  }
  for (i=0;i<gridLength;i++) {
    grid.push(twoDmap)
  }

  centerOffset = (gridLength / 2 - .5) * tileSize
  //centerOffset = 0

}

function draw() {
  background('#000000')
  for ([x, slice] of grid.entries()) {
    for ([y,row] of slice.entries()) {
      for ([z,tile] of row.entries()) {
        if (tile[0] === 1) {
          push();
          translate(x * tileSize - centerOffset, y * tileSize - centerOffset, z * tileSize - centerOffset)
          b = box(tileSize, tileSize, tileSize)
          pop();


        }
      }
    }
  }
}
