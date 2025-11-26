export const validateDesktopStep2 = async () => {
  console.log("Starting validateDesktopStep2");

  return new Promise<boolean>((resolve) => {
    let specificationValid = false;
    let pricingValid = false;
    let variantsValid = false;
    let specChecked = false;
    let pricingChecked = false;
    let variantsChecked = false;

    // Handler for specifications validation
    const handleSpecificationsResult = (e: Event) => {
      console.log("Received specificationsValidated event");
      const event = e as CustomEvent<{ isValid: boolean }>;
      specificationValid = event.detail.isValid;
      specChecked = true;
      console.log("SpecValid", specificationValid);
      checkAllResults();
    };

    // Handler for pricing validation
    const handlePricingResult = (e: Event) => {
      console.log("Received pricingValidated event");
      const event = e as CustomEvent<{ isValid: boolean }>;
      pricingValid = event.detail.isValid;
      pricingChecked = true;
      console.log("PricingValid", pricingValid);
      checkAllResults();
    };

    // Handler for variants validation
    const handleVariantsResult = (e: Event) => {
      console.log("Received variantsValidated event");
      const event = e as CustomEvent<{ isValid: boolean }>;
      variantsValid = event.detail.isValid;
      variantsChecked = true;
      console.log("VariantsValid", variantsValid);
      checkAllResults();
    };

    // Only resolve when all results are in
    const checkAllResults = () => {
      console.log(
        `Checking results: specChecked=${specChecked}, pricingChecked=${pricingChecked}, variantsChecked=${variantsChecked}`
      );
      if (specChecked && pricingChecked && variantsChecked) {
        // Remove event listeners before resolving
        document.removeEventListener(
          "specificationsValidated",
          handleSpecificationsResult as EventListener
        );
        document.removeEventListener(
          "pricingValidated",
          handlePricingResult as EventListener
        );
        document.removeEventListener(
          "variantsValidated",
          handleVariantsResult as EventListener
        );

        const result = specificationValid && pricingValid && variantsValid;
        console.log(`Resolving with result: ${result}`);
        resolve(result);
      }
    };

    // Add event listeners BEFORE dispatching events
    document.addEventListener(
      "specificationsValidated",
      handleSpecificationsResult as EventListener
    );
    document.addEventListener(
      "pricingValidated",
      handlePricingResult as EventListener
    );
    document.addEventListener(
      "variantsValidated",
      handleVariantsResult as EventListener
    );

    // Now dispatch events to trigger validation in all components
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent("validateSpecifications"));
      document.dispatchEvent(new CustomEvent("validatePricing"));
      document.dispatchEvent(new CustomEvent("validateVariants"));
    }, 100);

    // Timeout in case events never come back
    setTimeout(() => {
      console.log(
        `Timeout reached. specChecked=${specChecked}, pricingChecked=${pricingChecked}, variantsChecked=${variantsChecked}`
      );
      document.removeEventListener(
        "specificationsValidated",
        handleSpecificationsResult as EventListener
      );
      document.removeEventListener(
        "pricingValidated",
        handlePricingResult as EventListener
      );
      document.removeEventListener(
        "variantsValidated",
        handleVariantsResult as EventListener
      );
      resolve(false);
    }, 5000); // 5 second timeout
  });
};