const image = document.getElementById('colorImage');
const startSection = document.querySelector('.start');
const endSection = document.querySelector('.end');

function easeInCubic(t) {
    return t * t * t;
}

window.addEventListener('scroll', function() {
    const startSectionBottomPosition = startSection.getBoundingClientRect().bottom;

    // If startSection is still fully in the viewport, set image to grayscale and exit
    if (startSectionBottomPosition > window.innerHeight) {
        image.style.filter = 'grayscale(100%)';
        return;
    }

    // Determine the total distance between startSection's bottom and end's top
    const totalDistance = endSection.offsetTop - startSection.offsetTop;

    // Determine how far the user has scrolled within this range
    const distanceScrolled = window.scrollY + window.innerHeight - startSection.offsetTop;

    // Normalize the distance to a value between 0 and 1
    let scrollRatio = Math.min(Math.max(distanceScrolled / totalDistance, 0), 1);

    // Apply the ease-in function
    scrollRatio = easeInCubic(scrollRatio);

    // Convert the ratio to grayscale percentage
    const grayScaleValue = (1 - scrollRatio) * 100;

    // Apply the grayscale value to the image
    image.style.filter = `grayscale(${grayScaleValue}%)`;
});