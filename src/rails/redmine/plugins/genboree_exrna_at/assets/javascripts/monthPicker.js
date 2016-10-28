/* The monthPicker provides a convenience year checkbox which should toggle on or off all 
 * months belonging to that year; this is the event handler for year checkboxes
 * @param [Object] inputDomElem
 */
function toggleYearSelection(inputDomElem) {
  var id = inputDomElem.getAttribute("data-target");
  if(id != null) {
    var checked = inputDomElem.checked;
    $("#" + id + " input").prop("checked", checked);
  }
}

function toggleMonthSelection(inputDomElem) {
  var id = inputDomElem.getAttribute("data-target");
  if(id != null) {
    var checked = inputDomElem.checked;
    if(!checked) {
      // if month is not checked, neither should year
      $("#" + id).prop("checked", checked);
    }
  }
}

/* Get model of months to filter based on view selections
 * @param [String] id of ul with year divs
 * @return object showing which months have been selected like
   {
     <year>: {
       <month>: true,
       <month>: true,
       ...
     },
     ...
   }
 */
function getSelections(id) {
  var rv = {};
  var elem = $("#" + id);
  var yearDivs = elem.find("div")

  for (var ii = 0; ii < yearDivs.length; ii++) {
    var jqYearDiv = $(yearDivs[ii]);
    var yearStr = jqYearDiv.attr("data-year");
    if(!(typeof(yearStr) === 'undefined')) {
      var year = parseInt(yearStr);
      rv[year] = getMonthSelections(jqYearDiv);
    }
  }
  return rv;
}

/* Return selected months from a list of months
 * @param [Object] jqElem jQuery element with a list of input elements with type="checkbox" and data-month="<month>" attributes
 * @return [Object] 
 * {
 *   <month>: true,
 *   <month>: true,
 *   ...
 * }
 */
function getMonthSelections(jqElem) {
  var rv = {};
  var inputs = jqElem.find("ul input");
  for (var ii = 0; ii < inputs.length; ii++) {
    var jqInput = $(inputs[ii]);
    var checked = jqInput.prop("checked");
    if(checked) {
      var month = jqInput.attr("data-month");
      if(!(typeof(month) === 'undefined')) {
        rv[month] = checked;
      }
    }
  }
  return rv;
}

var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function dtDateFilter(settings, data, dataIndex) {
  var rv = true; // true keeps this row in the table
  var dateIndex = 0; // @todo index of "Job Date" in headers
  var dateObj = new Date(data[dateIndex]);
  if(isNaN(dateObj.getTime())) {
    // ERROR: dont subset any records
    rv = true;
  } else {
    var mpModel = getSelections("month-picker");
    var mpMonths = mpModel[dateObj.getFullYear()];
    if(!(typeof(mpMonths) === 'undefined')) {
      var month = MONTHS[dateObj.getMonth()];
      if(month in mpMonths) {
        rv = true;
      } else {
        rv = false;
      }
    } else {
      // ERROR: dont subset any records
      rv = true;
    }
  }
  return rv;
}

$(document).on('ready', function() {
  // Do not close dropdown menu when it is clicked on (only if it is clicked out of
  // see Arbejdsglæde at http://stackoverflow.com/questions/25089297/twitter-bootstrap-avoid-dropdown-menu-close-on-click-inside#25196101
  // @todo move this?
  $('.dropdown-menu').on('click', function(ee) {
    ee.stopPropagation();
  });

  // HTML elements defining the data-year attribute are year checkboxes which toggle month 
  // checkboxes as a convenience
  // trigger DataTable.draw() when filter menus change
  $('[data-year]').on('click', function(ee) {
    toggleYearSelection(ee.target);
    $("#report-table").DataTable().draw();
  });

  // HTML elements defining the data-month attribute are month checkboxes which may toggle
  // off year checkboxes (to avoid confusion)
  // trigger DataTable.draw() when filter menus change
  $('[data-month]').on('click', function(ee) {
    toggleMonthSelection(ee.target);
    $("#report-table").DataTable().draw();
  });


  // Add filter functions: these functions are invoked when DataTable.draw() happens
  $.fn.dataTable.ext.search.push(
    dtDateFilter
  );
});
