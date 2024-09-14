document.addEventListener("DOMContentLoaded", function () {
  $(".baller-container").show();
  $(".content-wrapper").hide();
  // Define a function to generate a doctor card HTML
  function createDoctorCard(doctor) {
    return `
            <div class="col-12 col-lg-4">
                <div class="box ribbon-box">
                    <div class="ribbon-two ${
                      doctor.type === "Full Time"
                        ? "ribbon-two-primary"
                        : "ribbon-two-danger"
                    }">
                        <span>${doctor.type}</span>
                    </div>
                    <div class="box-header no-border p-0">                
                        <a href="#">
                            <img class="img-fluid" src="../images/avatar/375x200/${
                              Math.floor(Math.random() * 8) + 1
                            }.jpg" alt="">
                        </a>
                    </div>
                    <div class="box-body">
                        <div class="text-center">
                            <div class="user-contact list-inline text-center">
                                <a href="#" class="btn btn-circle mb-5 btn-facebook"><i class="fa fa-facebook"></i></a>
                                <a href="#" class="btn btn-circle mb-5 btn-instagram"><i class="fa fa-instagram"></i></a>
                                <a href="#" class="btn btn-circle mb-5 btn-twitter"><i class="fa fa-twitter"></i></a>
                                <a href="#" class="btn btn-circle mb-5 btn-warning"><i class="fa fa-envelope"></i></a>                
                            </div>
                            <h3 class="my-10"><a href="#">${
                              doctor.name
                            }</a></h3>
                            <h6 class="user-info mt-0 mb-10 text-fade">${
                              doctor.specialization || "Specialization"
                            }</h6>
                            <p class="mt-10">Phone: ${doctor.phone || "N/A"}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
  }

  // Fetch doctor data from the API
  fetch("/server/dental_management_function/admin/doctors") // Replace with your API endpoint
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      const doctorListElement = document.getElementById("doctor-list");
      let doctorCards = "";

      data.forEach((doctor) => {
        // Example data transformation: Add 'Full Time' or 'Part Time' based on some logic
        doctor.type = doctor.hospital_id ? "Full Time" : "Part Time";

        doctorCards += createDoctorCard(doctor);
      });

      doctorListElement.innerHTML = doctorCards;
      $(".baller-container").hide();
      $(".content-wrapper").show();
    })
    .catch((error) => console.error("Error fetching doctor data:", error));
});
