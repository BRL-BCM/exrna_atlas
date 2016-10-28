function emailIsValid(email) {
  var regex = /^\w+@\w+/ ;
  return regex.test(email);
}

function displayContactFail(message) {
  var contactFailElem = $("#contact-fail")
  contactFailElem.text(message);
  contactFailElem.css("display", "block") ;
}

$(document).ready(function() {
  // add listener to close buttons
  $("#contact-success .close").click(function() {
    $("#contact-success").css("display", "none");
  });

  // add listener to contact us form
  var formElem = $("#contact-us-form");
  formElem.on("submit", function(ee) {
    // validate the form
    var errorMessage = "There was an error sending your message. Please try again later."; // TODO; default for http errors
    var validEmail = emailIsValid($("#userEmail").val());
    if(!validEmail) {
      errorMessage = "Please enter a valid email address.";
    }
    var formIsValid = validEmail;
    console.log("formIsValid:");
    console.log(formIsValid);
    if(!formIsValid) {
      // display error 
      console.log("inside if");
      displayContactFail(errorMessage);
    } else {
      // submit the data
      console.log("inside else");
      $.ajax({
        url: formElem.attr('action'),
        method: "POST",
        data: formElem.serialize(),
        success: function(data, textStatus, jqXHR) {
          // display success message
          $("#contact-success").css("display", "block");

          // close the contact us modal
          $("#contactUsModal").modal('hide');
        },
        error: function(jqXHR, textStatus, errorThrown) {
          // display failure message
          $("#contact-fail").css("display", "block");
        }
      });
    }

    // avoid duplicate submission
    ee.preventDefault();
  });

  // when contact us modal is closed; close any failure alert, reset form
  $("#contactUsModal").on('hidden.bs.modal', function (e) {
    $("#contact-fail").css("display", "none");
    $("#contact-us-form")[0].reset();
  });
});
