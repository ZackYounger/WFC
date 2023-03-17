let canvas;
let ctx;
let coords = [];
let points = []
let mousePos = [0, 0];

topColor = 0x3d63c7; // wrong also
HSVTopColor = [.62,.69,.85]
bottomColor = 0x8a42e7; //these are wrong now
HSVBottomColor = [.70,.69,.85] // try h = .55 it was .74
hueDiff = HSVTopColor[0] - HSVBottomColor[0]

window.onload  = function () {

    var docElement = document.documentElement;

    tl = gsap.timeline({defaults: {ease: "power1.out"}, onUpdate: updateRoot});
    cs = getComputedStyle(docElement, null);

    var canvasBlur = {
        value: cs.getPropertyValue("--canvasBlur")
    };

    tl.fromTo(canvasBlur, { value: '100px' }, { value: '0px', duration: 1 }, "=0");

    function updateRoot() {
        docElement.style.setProperty("--canvasBlur", canvasBlur.value);
    }

    tl.fromTo(".big-text", { opacity: 0 }, { opacity: 1, duration: 2 }, "=1");





    canvas = document.getElementById('canvas');
    console.log(canvas)
    if (canvas.getContext) {
        ctx = canvas.getContext('2d');

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

    } else {
        console.log("Canvas is not supported!!")
    }

    //construct points
    numPoints = 50;
    //coords = [];
    for (i=0;i<numPoints;i++) {
        startingCoords = [Math.random() * canvas.width, Math.random() * canvas.height];
        points.push(new Point(startingCoords, false));
        //points.push(new Point([500,500],true));
        //coords.push(null);
    }


    //animation
    /*
    rectDims = [150,80]
    rectCoords = [[window.innerWidth/2 - rectDims[0], window.innerHeight/2 - rectDims[1]],
                  [window.innerWidth/2 - rectDims[0], window.innerHeight/2 + rectDims[1]],
                  [window.innerWidth/2 + rectDims[0], window.innerHeight/2 + rectDims[1]],
                  [window.innerWidth/2 + rectDims[0], window.innerHeight/2 - rectDims[1]]]

    selectedPoints = assignPoints(rectCoords);

    rectDims = [150,300]
    rectCoords = [[400 - rectDims[0], 400 - rectDims[1]],
                  [400 - rectDims[0], 400 + rectDims[1]],
                  [400 + rectDims[0], 400 + rectDims[1]],
                  [400 + rectDims[0], 400 - rectDims[1]]]

    selectedPoints2 = assignPoints(rectCoords);*/

    window.addEventListener('resize', function(e) {
        resize()
    })
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }




    setInterval(function() {
        frames++
        //background
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (point of points) {
            point.update();
        }

        coords = []
        for ([index, point] of points.entries()) {
            point.move();
            for (x=-1;x<2;x++) {
                for (y=-1;y<2;y++) {
                    coords.push([window.innerWidth * x + point.pos[0],
                                 window.innerHeight * y + point.pos[1]])
                }
            }
            coords[index] = point.pos;
        }

        flatCoords = coords.flat();
        DelaunatorData = new Delaunator(flatCoords);
        triCoords = DelaunatorData.triangles;


        //construct triangles
        triangles = [];
        for (let i = 0; i < triCoords.length; i += 3) {
            var thisTriangle = [
                coords[triCoords[i]],
                coords[triCoords[i + 1]],
                coords[triCoords[i + 2]]
            ];
            triangles.push(thisTriangle);
        }

        //draw coords
        //for (var coord of coords) {
        //    drawCircle(ctx,coord[0],coord[1],7,'black','black',3);
        //    }

        //draw triangles
        colorMeans = [];
        for (let i = 0; i < triangles.length; i ++) {
            var thisTriangle = triangles[i];


            meanX = (thisTriangle[0][0]+thisTriangle[1][0]+thisTriangle[2][0])/3;
            //technically do not need to calculate meanX or draw the triangle
            meanY = (thisTriangle[0][1]+thisTriangle[1][1]+thisTriangle[2][1])/3;

            hue = HSVTopColor[0] - hueDiff * (meanY / window.innerHeight);

            colorMeans.push([meanX, meanY, hue]);

            color = HSVtoRGB(hue, HSVTopColor[1], HSVTopColor[2]);

            hue = 1

            strColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${hue})`;

            drawTriangle(ctx, thisTriangle[0],
                              thisTriangle[1],
                              thisTriangle[2], strColor, 0, 0);

            //drawCircle(ctx, meanX, meanY, 5, 'gray', 0, 0)
        }
        //testing circle
        //drawCircle(ctx,coords[0][0],coords[0][1],7,'black','black',3);
        //for (colorMean of colorMeans) {
        //    drawCircle(ctx, colorMean[0], colorMean[1], 5, 'gray', 0, 0);
        //}

        //animation
        //for (coord of rectCoords) { drawCircle(ctx, coord[0], coord[1], 5, 'black', 0, 0); }
        //for (point of selectedPoints) { drawCircle(ctx, point.pos[0], point.pos[1], 5, 'gray', 0, 0); }

    }, 1000/60);
};

function drawCircle(ctx, x, y, radius, fill, stroke, strokeWidth) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
    }
    if (stroke) {
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = stroke;
        ctx.stroke();
    }
}

function drawTriangle(ctx, p1, p2, p3, fill, stroke, strokeWidth) {
    ctx.beginPath();
    ctx.moveTo(p1[0],p1[1]);
    ctx.lineTo(p2[0],p2[1]);
    ctx.lineTo(p3[0],p3[1]);
    ctx.closePath();

    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
    }
    if (stroke) {
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = stroke;
        ctx.stroke();
    }
}

function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255)
    ];
}

function addVec(a, b) {
    return [a[0] + b[0], a[1] + b[1]];
}

let diff, tempDiff, metaDiff, mag, tempMag, normalized, totalForce;
let targetDist, targetTotalForce;
let l;
G = 100;
targetForce = 10000;
mouseForce = 0;

class Point {
    constructor(coords, fixed) {
        this.pos = coords;
        this.vel = [0, 0];
        this.acc = [0, 0];
        this.force = [0, 0];
        this.target = false;
        this.wander = Math.random() * 0.02;
        this.wanderAcc = [0,0];
    }
    update() {
        //this is needing some heavy abstraction lmao but just not atm
        this.force[0] = 0;
        this.force[1] = 0;
        this.acc[0] = 0;
        this.acc[1] = 0;
        for (point of points) {
            metaDiff = [this.pos[0] - point.pos[0],
                this.pos[1] - point.pos[1]];
            mag = Math.sqrt(metaDiff[0] ** 2 + metaDiff[1] ** 2)
            if (metaDiff[0] !== 0 || metaDiff[1] !== 0) {
                for (let x=-1;x<2;x++) {
                    for (let y=-1;y<2;y++) {
                        tempDiff = [window.innerWidth*x + metaDiff[0],
                            window.innerHeight*y + metaDiff[1]]
                        tempMag = Math.sqrt(tempDiff[0] ** 2 + tempDiff[1] ** 2)
                        if (tempMag <= mag) {mag = tempMag; diff = tempDiff}
                    }
                }
                normalized = [diff[0] / mag,
                    diff[1] / mag]
                totalForce = (G / mag ** 2)
                this.force[0] += totalForce * normalized[0]
                this.force[1] += totalForce * normalized[1]
            }
            if (point.fixed && false) {
                ctx.beginPath();
                ctx.moveTo(this.pos[0]-diff[0],this.pos[1]-diff[1]);
                ctx.lineTo(this.pos[0],this.pos[1]);
                if (l) {ctx.strokeStyle = "rgb(155,0,0)";} else {ctx.strokeStyle = "rgb(0,0,0)";}
                ctx.stroke();
            }
        }
        diff = [this.pos[0] - mousePos[0],
                this.pos[1] - mousePos[1]]
        if (diff[0] !== 0 || diff[1] !== 0) {
            mag = Math.sqrt(diff[0] ** 2 + diff[1] ** 2)
            normalized = [diff[0] / mag,
                diff[1] / mag]
            totalForce = (G / mag ** 2) * mouseForce
            this.force[0] += totalForce * normalized[0]
            this.force[1] += totalForce * normalized[1]
        }
        //wandering
        if (Math.random() < 0.01) {
            this.wanderAcc = [(0.5 - Math.random())*this.wander, (0.5 - Math.random())*this.wander]
        }
        //assuming mass to be 1 pepaga
        this.acc = addVec(this.force, this.wanderAcc)

        if (this.target) {
            //OPTIMISE
            diff = [this.pos[0] - this.target[0],
                    this.pos[1] - this.target[1]];
            mag = Math.sqrt(diff[0] ** 2 + diff[1] ** 2)
            normalized = [diff[0] / mag,
                          diff[1] / mag]

            targetTotalForce = targetForce / ( window.innerWidth - Math.min(window.innerWidth - 1, window.innerWidth - mag)**2 )

            //minimise existing acc
            this.acc = [this.acc[0]*0.2, this.acc[1]*0.2]

            this.acc[0] += targetTotalForce * normalized[0]
            //console.log( window.width - Math.min(window.innerWidth - 1, window.innerWidth - targetDist)**2 )
            this.acc[1] += targetTotalForce * normalized[1]

        }
    }
    move() {
        this.vel = [this.vel[0]*0.99,
                    this.vel[1]*0.99]
        this.vel = addVec(this.acc, this.vel);
        this.pos = addVec(this.vel, this.pos);

        if (this.pos[0] < 0) {this.pos[0]+=window.innerWidth}
        if (this.pos[1] < 0) {this.pos[1]+=window.innerHeight}
        if (this.pos[0] > window.innerWidth) {this.pos[0]-=window.innerWidth}
        if (this.pos[1] > window.innerWidth) {this.pos[1]-=window.innerHeight}
    }

}

addEventListener('mousemove', function(e) {
    mousePos = [e.pageX,e.pageY]
})

setInterval(function() {
    console.log("fps    " + frames)
    frames = 0
    }, 1000);


function assignPoints(rectCoords) {
    selectedPoints = [];
    for (coord of rectCoords) {
        chosenDist = 99999
        for (point of points) {
            dist = Math.sqrt((point.pos[0] - coord[0])**2 + (point.pos[1] - coord[1])**2)
            if (dist < chosenDist && !selectedPoints.includes(point)) { chosenDist = dist; chosenPoint = point }
        }
        selectedPoints.push(chosenPoint)
        chosenPoint.target = coord
    }
    return selectedPoints
}