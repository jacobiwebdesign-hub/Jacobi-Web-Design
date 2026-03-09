const canvas=document.getElementById("particles");
const ctx=canvas.getContext("2d");
const seriesSlider = document.querySelector("[data-series-slider]");

canvas.width=window.innerWidth;
canvas.height=window.innerHeight;

let particles=[];

for(let i=0;i<120;i++){

particles.push({
x:Math.random()*canvas.width,
y:Math.random()*canvas.height,
size:Math.random()*2,
speed:Math.random()*0.5
})

}

function animate(){

ctx.clearRect(0,0,canvas.width,canvas.height)

particles.forEach(p=>{

p.y-=p.speed

if(p.y<0)p.y=canvas.height

ctx.fillStyle="rgba(255,40,40,0.4)"

ctx.beginPath()
ctx.arc(p.x,p.y,p.size,0,Math.PI*2)
ctx.fill()

})

requestAnimationFrame(animate)

}

animate()

function initializeSeriesSlider() {
  if (!seriesSlider) return;

  const track = seriesSlider.querySelector(".series-track");
  const slides = Array.from(seriesSlider.querySelectorAll(".series-card"));
  const prevBtn = seriesSlider.querySelector(".series-prev");
  const nextBtn = seriesSlider.querySelector(".series-next");
  const dots = Array.from(seriesSlider.querySelectorAll(".series-dot"));

  if (!track || slides.length === 0) return;

  let activeIndex = 0;
  let autoPlayId = null;

  const applySlide = (index) => {
    activeIndex = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${activeIndex * 100}%)`;

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === activeIndex);
    });
  };

  const nextSlide = () => applySlide(activeIndex + 1);
  const prevSlide = () => applySlide(activeIndex - 1);

  const restartAutoPlay = () => {
    if (autoPlayId) window.clearInterval(autoPlayId);
    autoPlayId = window.setInterval(nextSlide, 4500);
  };

  nextBtn?.addEventListener("click", () => {
    nextSlide();
    restartAutoPlay();
  });

  prevBtn?.addEventListener("click", () => {
    prevSlide();
    restartAutoPlay();
  });

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      applySlide(index);
      restartAutoPlay();
    });
  });

  applySlide(0);
  restartAutoPlay();
}

initializeSeriesSlider();

window.addEventListener("resize",()=>{

canvas.width=window.innerWidth
canvas.height=window.innerHeight

})
