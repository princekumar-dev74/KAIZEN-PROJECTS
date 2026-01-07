const cam = document.querySelector(".cam");

navigator.mediaDevices
  .getUserMedia({ video: { facingMode: "user" } })
  .then((stream) => {
    cam.srcObject = stream;
    cam.play();
  })
  .catch((err) => console.log(err));

cam.addEventListener("click", () => {
  alert("Hand Coded By PMBPG");
});
