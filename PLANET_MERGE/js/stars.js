const starsCanvas = document.getElementById('stars-canvas');
const starsCtx = starsCanvas.getContext('2d');


const starCount = 200;
const stars = [];
for (let i = 0; i < starCount; i++) {
    stars.push({
        x: Math.random() * starsCanvas.width,
        y: Math.random() * starsCanvas.height,
        radius: Math.random() * 1.5 + 0.2,
        twinkleSpeed: Math.random() * 0.05 + 0.02,
        twinkleOffset: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1
    });
}

function resizeStars() {
    const oldWidth = starsCanvas.width;
    const oldHeight = starsCanvas.height;
    starsCanvas.width = window.innerWidth;
    starsCanvas.height = window.innerHeight;

    for (let s of stars) {
        s.x = Math.random() * starsCanvas.width;
        s.y = Math.random() * starsCanvas.height;
    }
}
resizeStars();
window.addEventListener('resize', resizeStars);



function drawStars() {
    starsCtx.clearRect(0, 0, starsCanvas.width, starsCanvas.height);
    const time = Date.now() * 0.002;

    for (let s of stars) {
        const alpha = 0.5 + 0.5 * Math.sin(time * s.twinkleSpeed + s.twinkleOffset);

        s.x += s.vx;
        s.y += s.vy;

        if (s.x < 0) s.x = starsCanvas.width;
        if (s.x > starsCanvas.width) s.x = 0;
        if (s.y < 0) s.y = starsCanvas.height;
        if (s.y > starsCanvas.height) s.y = 0;

        starsCtx.beginPath();
        starsCtx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        starsCtx.fillStyle = `rgba(255,255,255,${alpha})`;
        starsCtx.fill();
    }

    requestAnimationFrame(drawStars);
}
drawStars();