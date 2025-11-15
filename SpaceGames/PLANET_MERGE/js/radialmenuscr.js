const menu = document.getElementById('radial-menu');
const buttons = menu.querySelectorAll('.menu-btn');
const radius = 70;
let isOpen = false;

function positionButtons() {
    const step = (2 * Math.PI) / buttons.length;
    buttons.forEach((btn, i) => {
        const angle = i * step - Math.PI / 2;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        btn.dataset.x = x;
        btn.dataset.y = y;
    });
}
positionButtons();

function showMenu(x, y) {
    isOpen = true;
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.classList.add('active');
    menu.style.display = 'block';

    buttons.forEach((btn, i) => {
        const delay = i * 50;
        setTimeout(() => {
            btn.style.transform = `translate(${40 + parseFloat(btn.dataset.x)}px, ${40 + parseFloat(btn.dataset.y)}px) scale(1)`;
            btn.style.opacity = '1';
        }, delay);
    });
}

function hideMenu() {
    if (!isOpen) return;
    isOpen = false;

    buttons.forEach((btn, i) => {
        const delay = i * 40;
        setTimeout(() => {
            btn.style.transform = `translate(40px, 40px) scale(0)`;
            btn.style.opacity = '0';
        }, delay);
    });

    setTimeout(() => {
        menu.style.display = 'none';
        menu.classList.remove('active');
    }, 400 + buttons.length * 40);
}

document.addEventListener('contextmenu', e => {
    e.preventDefault();
    showMenu(e.clientX, e.clientY);
});

document.addEventListener('click', e => {
    if (!menu.contains(e.target)) hideMenu();
});

buttons.forEach(btn => {
    btn.addEventListener('click', e => {
        const action = e.target.dataset.action;
        hideMenu();
    });
});

// mobile
let pressTimer;
document.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        pressTimer = setTimeout(() => {
            showMenu(touch.clientX, touch.clientY);
        }, 600);
    }
});

document.addEventListener('touchend', () => clearTimeout(pressTimer));
document.addEventListener('touchstart', e => {
    if (!menu.contains(e.target)) hideMenu();
});