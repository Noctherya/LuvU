document.body.style.backgroundColor = "lightblue";
document.addEventListener('DOMContentLoaded', () => {
  const envelopeContainer = document.getElementById('envelopes');
  if (envelopeContainer) {
    envelopeContainer.innerHTML = '<h1 style="color:black; text-align:center; margin-top:50px;">HIER SIND DIE BRIEFE!</h1>';
  }
});
