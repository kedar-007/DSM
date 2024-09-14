document.addEventListener("DOMContentLoaded", function () {
  $(".baller-container").show();
  $(".content-wrapper").hide();
  const urlParams = new URLSearchParams(window.location.search);
  const clinicId = urlParams.get("clinicId");

  console.log("Clinic Id from URL:", clinicId);

  if (clinicId) {
    // Fetch all data from the server
    fetch(
      `/server/dental_management_function/admin/hospital/${clinicId}/details`
    )
      .then((response) => response.json())
      .then((data) => {
        // console.log("Fetched data:", data);

        // Extract data
        const hospital = data.hospital;
        const doctors = data.doctors;
        const receptionists = data.receptionists;
        const patients = data.patients;
        const appointments = data.appointments;

        $(".baller-container").hide();
        $(".content-wrapper").show();

        console.log("Doctors", doctors);
        console.log("Receptionist", receptionists);
        console.log("Patients", patients);
        console.log("Appointments", appointments);

        // Populate DataTables for each dataset

        // Initialize DataTable for Doctors
        $("#doctors").DataTable({
          data: doctors,
          paging: true,
          lengthChange: true,
          searching: true,
          ordering: true,
          info: true,
          autoWidth: false,
          columns: [
            { title: "Name", data: "name" },
            { title: "Phone", data: "phone" },
            { title: "Email", data: "email" },
          ],
        });

        // Initialize DataTable for Receptionists
        $("#receptionist").DataTable({
          data: receptionists,
          paging: true,
          lengthChange: true,
          searching: true,
          ordering: true,
          info: true,
          autoWidth: false,
          columns: [
            { title: "Name", data: "name" },
            { title: "Phone", data: "phone" },
            { title: "Email", data: "email" },
          ],
        });

        // Initialize DataTable for Patients
        $("#patients").DataTable({
          data: patients,
          paging: true,
          lengthChange: true,
          searching: true,
          ordering: true,
          info: true,
          autoWidth: false,
          columns: [
            { title: "Patient Name", data: "patient_name" },
            { title: "Date of Admission", data: "date_of_admission" },
            { title: "Doctor Assigned", data: "doctor_id" },
            { title: "Phone", data: "phone" },
            { title: "Status", data: "patient_status" },
            { title: "Address", data: "address" },
            { title: "DOB", data: "date_of_birth" },
            { title: "Gender", data: "gender" },
          ],
        });

        // Initialize DataTable for Appointments
        $("#appointments").DataTable({
          data: appointments,
          paging: true,
          lengthChange: true,
          searching: true,
          ordering: true,
          info: true,
          autoWidth: false,
          columns: [
            { title: "Name", data: "name" },
            { title: "Time", data: "date_time" },
            { title: "Doctor Assigned", data: "doctor_id" },
            { title: "Phone", data: "phone_no" },
            { title: "Gender", data: "gender" },
            { title: "Status", data: "status" },
            { title: "Address", data: "address" },
          ],
        });
      })
      .catch((error) => console.error("Error fetching data:", error));
  } else {
    console.error("No clinic ID found in URL.");
  }
});
