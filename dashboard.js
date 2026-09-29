  /* =========================
     CONTRACT DIGITS
  ========================= */

  const contractDigits =
    $("#contractDigits");


  for (let i = 0; i < 10; i++) {

    const button =
      document.createElement("button");

    button.textContent = i;

    button.dataset.digit = i;

    button.onclick = () => {

      selectedDigit = i;

      [...contractDigits.children]
        .forEach(element =>
          element.classList.remove("active")
        );

      button.classList.add("active");

      generateProbabilities();

      toast(`Digit ${i} selected.`);

    };

    contractDigits.appendChild(button);

  }


  contractDigits.children[0].classList.add("active");
