const bgCanvas = document.getElementById("stars-bg");
const bgCtx = bgCanvas.getContext("2d");

function resizeBG() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
}
resizeBG();
window.addEventListener("resize", resizeBG);

function createStars(count, width, height) {
    const arr = [];
    for (let i = 0; i < count; i++) {
        const layer = 1 + (Math.random() * 3) | 0;

        arr.push({
            x: Math.random() * width,
            y: Math.random() * height,
            layer,
            size:
                layer === 1 ? Math.random() * 1.2 :
                layer === 2 ? Math.random() * 1.8 + 0.2 :
                Math.random() * 2.4 + 0.4,
            speed:
                layer === 1 ? 0.2 :
                layer === 2 ? 0.7 :
                1.1
        });
    }
    return arr;
}

const bgStars = createStars(250, window.innerWidth, window.innerHeight);
let fgStars = [];

function updateStarArray(stars, height, width) {
    stars.forEach(s => {
        s.y += s.speed * (s.layer * 0.4);
        if (s.y > height) {
            s.y = -5;
            s.x = Math.random() * width;
        }
    });
}

function drawBackgroundStars() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

    bgStars.forEach(s => {
        bgCtx.fillStyle =
            s.layer === 1 ? "rgba(255,255,255,0.4)" :
            s.layer === 2 ? "rgba(255,255,255,0.75)" :
                             "rgba(255,255,255,1)";

        bgCtx.fillRect(s.x, s.y, s.size, s.size);
    });
}

function bgLoop() {
    updateStarArray(bgStars, bgCanvas.height, bgCanvas.width);
    drawBackgroundStars();
    requestAnimationFrame(bgLoop);
}
bgLoop();

window.starfield = {
    createStars,
    updateStarArray
};
