document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("addClinicForm");
  const loader = document.getElementById("loader");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Show loader
    loader.classList.remove("loader-hidden");

    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => (data[key] = value));
    console.log(data);

    try {
      const response = await fetch(
        "/server/dental_management_function/admin/hospital",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();
      console.log(result);
      if (response.ok) {
        // Show success alert
        alert("Clinic added successfully!");
        form.reset();
      } else {
        // Show error alert
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      // Show error alert
      alert(`An error occurred: ${error.message}`);
    } finally {
      // Hide loader
      loader.classList.add("loader-hidden");
    }
  });
});

function cancelForm() {
  document.getElementById("addClinicForm").reset();
}
