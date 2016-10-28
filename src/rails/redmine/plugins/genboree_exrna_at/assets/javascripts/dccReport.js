var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// When DataTables makes a request to the server for the report; update the cache as well
function dtAjaxHandler(data, callback, settings) {
  $.ajax({
    url: GenboreeExrnaAt.pluginPath + "/report_dt",
    success: function(data, textStatus, jqXHR) {
      callback(data);
    }
  });
  $.ajax({
    url: GenboreeExrnaAt.pluginPath + "/report_dt",
    method: "POST"
  });
}

/* Re-draw table with full update (filters, sorting, etc.)
 */
function viewUpdateTable() {
  $("#report-table").DataTable().draw();
}

/* Re-draw table with no update
 */
function viewUpdateTablePage() {
  $("#report-table").DataTable().draw("page")
}

/* Calculate the total number of submitted samples
 * @param [Array<Object>] rowData objects with "Number of Submitted Samples" key
 */
function calcTotalSamples(rowData) {
  var totalSamples = 0;
  for(var ii = 0; ii < rowData.length; ii++) {
    totalSamples += rowData[ii]['Number of Submitted Samples'];
  }
  return totalSamples;
}

/* Configure DataTables table
 * @see https://datatables.net/reference/option/dom
 * @todo the 'dom' config is going to be updated to be much more flexible/easy to use in the 
 *   next version of DataTables; it is a little insane now
 */
myTable = null;
myWindow = null;
myApi = null;
function initReportTable() {
  var header = GenboreeExrnaAt["header"];
  columns = Array(header.length);
  for (var i = 0; i < header.length; i++) { 
    columns[i] = { data: header[i] } ;
  }
  var table = $("#report-table").DataTable({
    scrollY: "600px",
    scrollCollapse: true,
    processing: true,
    responsive: true,
    autoWidth: false,
    ajax: dtAjaxHandler,
    columns: columns,
    dom: "<'row'<'col-sm-4 text-left'l><'col-sm-4 text-center'f><'col-sm-4 text-right'>>" +
      "<'row'<'col-sm-12'tr>>" +
      "<'row'<'col-sm-5'i><'col-sm-7'p>>"
  });
  myTable = table;
  table.on("search.dt", function(ee, settings) {
    // after search, total number of submitted samples
    var rowData = table.rows({search: 'applied'}).data();
    var totalSamples = calcTotalSamples(rowData);
    // @todo DataTables footer API is causing duplicate footers
    $("#report-table_wrapper tfoot").html("Total submitted samples for selection: " + totalSamples.toString());
  });

  // the "new" constructor allows for more control of the placement of these buttons 
  //   (although is not necessary for the current configuration)
  new $.fn.dataTable.Buttons(table, {
    buttons: [
      {
        extend: 'print',
        autoPrint: false,
        className: 'btn btn-default',
        title: 'DCC Data Submission Report',
        customize: function(ww) {
          var jqDiv = $('div:eq(0)', $(ww.document.body));
          var filterBody = $("#filter-body").clone();
          // here in the print view we dont have a need for the selector, just the selections
          $(".filter-selector", filterBody).remove();
          // also remove the buttons that allow for filter selection removal
          $(".filter-selections a", filterBody).remove();
          // add modified filters to print view
          jqDiv.append(filterBody);

          // add also the table footer to the print view
          var jqBody = $(ww.document.body);
          var jqTfoot = $('.dataTables_scrollFoot');
          var jqDiv0 = $("<div class=\"row\"></div>");
          var jqDiv1 = $("<div class=\"col-sm-12\"></div>");
          jqDiv1.append(jqTfoot.clone());
          jqDiv0.append(jqDiv1);
          jqBody.append(jqDiv0);
        }
      },
      {
        extend: 'csv',
        className: 'btn btn-default',
        fieldSeparator: '\t',
        filename: 'DCC_Data_Submission_Report'
      }
    ]
  });

  table.buttons().container()
    .appendTo($('.col-sm-4:eq(2)', table.table().container()));
}

/* Sort array of pairs
 */
function sortPairs(pairs) {
  pairs.sort(function(aa, bb) {
    if(aa[0] < bb[0]) {
      return -1;
    } else if(aa[0] > bb[0]) {
      return 1;
    } else {
      return aa[1] - bb[1];
    }
  });
}

/* Timeout wrapper around _resizeHandler
 */
function resizeHandler() {
  if(!GenboreeExrnaAt.resizeTimeout) {
    GenboreeExrnaAt.resizeTimeout = setTimeout(function() {
      GenboreeExrnaAt.resizeTimeout = null;
      _resizeHandler();
    }, 66);
  }
}

/* Handle resize event by refreshing DataTables display
 */
function _resizeHandler() {
  viewUpdateTablePage();
}

/* **************************************************
 * Date filter functions - {{
 * **************************************************
 */

/* Extract year, month and update the Exat model
 */
function controlAddDate() {
  var yearElem = $("#select-year");
  var monthElem = $("#select-month");
  var year = parseInt(yearElem.val());
  var month = parseInt(monthElem.val()) - 1;
  modelAddDate(year, month);
  var rv = [year, month];
  return rv;
}

/* Update global GenboreeExrnaAt.jobDates with year, month
 */
function modelAddDate(year, month) {
  if (typeof(GenboreeExrnaAt.jobDates[year]) === 'undefined') {
    GenboreeExrnaAt.jobDates[year] = {};
  }
  GenboreeExrnaAt.jobDates[year][month] = true;
}

/* Remove all date filters from the model
 */
function modelDeleteDates() {
  GenboreeExrnaAt.jobDates = {};
}

/* Remove a date filter from the model
 */
function modelDeleteDate(year, month) {
  delete GenboreeExrnaAt.jobDates[year][month];
  if(jQuery.isEmptyObject(GenboreeExrnaAt.jobDates[year])) {
    delete GenboreeExrnaAt.jobDates[year];
  }
}

/* Display a date filter in UI
 */
function viewDate(year, month) {
  var aElem = $("<a class=\"fa fa-times\"></a>");
  aElem.on('click', function(ee) {
    var target = $(ee.target);
    var liElem = target.parent();
    viewDeleteDate(liElem);
    modelDeleteDate(year, month);
    viewUpdateTable();
  });
  var liElem = $("<li>" + MONTHS[month] + ", " + year + "</li>");
  liElem.append(aElem);
  return liElem;
}

/* Display date filters in UI
 */
function viewDates() {
  var listElem = $("#date-selections ul");
  listElem.empty();
  var dates = [];
  for (year in GenboreeExrnaAt.jobDates) {
    months = GenboreeExrnaAt.jobDates[year];
    for (month in months) {
      var date = [year, month];
      dates.push(date)
    }
  }
  sortPairs(dates);
  for (var ii = 0; ii < dates.length; ii++) {
    var jobDate = dates[ii];
    listElem.append(viewDate(jobDate[0], jobDate[1]));
  }
}

/* Remove a single date filter from the UI
 */
function viewDeleteDate(liElem) {
  liElem.remove();
}

/* Use model to filter rows; return true if the row passes the filters
 * https://www.datatables.net/examples/plug-ins/range_filtering.html
 */
function dtDateFilter(settings, data, dataIndex) {
  var rv = true; // true keeps this row in the table
  var dateIndex = 0; // @todo index of "Job Date" in headers
  var dateObj = new Date(data[dateIndex]);
  if(isNaN(dateObj.getTime())) {
    // ERROR: dont subset any records
    rv = true;
  } else {
    var mpModel = GenboreeExrnaAt.jobDates;
    if(!jQuery.isEmptyObject(mpModel)) {
      var mpMonths = mpModel[dateObj.getFullYear()];
      if(!(typeof(mpMonths) === 'undefined')) {
        var month = dateObj.getMonth();
        if(month in mpMonths) {
          rv = true;
        } else {
          rv = false;
        }
      } else {
        // then no months in this year are selected
        rv = false;
      }
    } else {
      // then there are no filters
      rv = true
    }
  }
  return rv;
}
/* }} ************************************************** */

/* **************************************************
 * Exact match filters functions - {{
 * **************************************************
 */

/* Add selected filter to model; event handler for add button */
function controlAddFilter(filterId) {
  var filterValue = $("#" + filterId + "-select").val();
  modelAddExatFilter(filterId, filterValue);
}

/* Add selected filter to the Exat model which stores selected filter values
 *   before passing them to DataTable's model, which will be read when DataTable().draw() occurs
 */
function modelAddExatFilter(filterId, filterValue) { 
  if(typeof(GenboreeExrnaAt.filterValues[filterId]) === 'undefined') {
    GenboreeExrnaAt.filterValues[filterId] = {};
  }
  GenboreeExrnaAt.filterValues[filterId][filterValue] = true;
}

/* Remove selected filter @liElem@ from list of selected filters in model
 */
function modelDeleteExatFilterValue(filterId, value) {
  delete GenboreeExrnaAt.filterValues[filterId][value];
}

/* Remove all values from a single field's filter
 */
function modelDeleteExatFilter(filterId) {
  GenboreeExrnaAt.filterValues[filterId] = {};
}

/* Add filter to DataTables model so that when we tell the UI to update with draw(),
 *   it will only display rows that pass the filter
 */
function modelAddDtFilter(filterId) {
  var columnName = GenboreeExrnaAt.filterToColumn[filterId];
  var index = GenboreeExrnaAt.header.indexOf(columnName);
  var table = $("#report-table").DataTable();

  var values = [];
  for (value in GenboreeExrnaAt.filterValues[filterId]) {
    var escValue = $.fn.dataTable.util.escapeRegex(value);
    values.push(escValue);
  }
  var searchValue = values.join("|");

  table.columns(index).search(searchValue, true, false);
}

/* Remove filter from DataTables model so that more rows are displayed after we
 *   tell DataTables to update with draw()
 */
function modelDeleteDtFilter(filterId) {
  var columnName = GenboreeExrnaAt.filterToColumn[filterId];
  var index = GenboreeExrnaAt.header.indexOf(columnName);
  var table = $("#report-table").DataTable();
  table.columns(index).search("");
}

/* Remove selected filter @liElem@ from list of selected filters in UI
 */
function viewDeleteFilterItem(filterId, liElem) {
  liElem.remove();
}

/* Construct li element to add to ul with a button (actually a hyperlink) to
 *   remove the item from the view and the model
 */
function viewDisplayFilterValue(filterId, value) {
  var aElem = $("<a class=\"fa fa-times\"></a>");
  aElem.on('click', function(ee) {
    var target = $(ee.target);
    var liElem = target.parent();
    viewDeleteFilterItem(filterId, liElem);
    modelDeleteExatFilterValue(filterId, value);
    modelDeleteDtFilter(filterId);
    viewUpdateTable();
  });
  var liElem = $("<li>" + value + "</li>");
  liElem.append(aElem);
  return liElem;
}

/* Construct ul element from selected filter values
 * @see viewDisplayFilterValue
 */
function viewDisplayFilterValues(filterId) {
  var listElem = $("#" + filterId + "-selections ul");
  listElem.empty();
  var values = [];
  for (value in GenboreeExrnaAt.filterValues[filterId]) {
    values.push(value);
  }
  values.sort();
  for (var ii = 0; ii < values.length; ii++)  {
    var value = values[ii];
    var liElem = viewDisplayFilterValue(filterId, value);
    listElem.append(liElem);
  }
}
/* }} ************************************************** */

$(document).ready(function() {
  GenboreeExrnaAt.pluginId = "exat";
  GenboreeExrnaAt.pluginPath = urlMount + "/projects/" + encodeURIComponent(projectId) + "/" + encodeURIComponent(GenboreeExrnaAt.pluginId);

  // Configure DataTables and initialize it
  $.fn.dataTable.ext.errMode = 'throw'; // log AJAX request errors to console rather than alerting
  $.fn.dataTable.ext.search.push(
    // Add filter functions: these functions are invoked when DataTable.draw() happens
    dtDateFilter
  );
  initReportTable();

  // define date filters callbacks
  GenboreeExrnaAt.jobDates = {}; // year, month nested
  $("#add-month").on('click', function(ee) {
    controlAddDate();
    viewDates();
    viewUpdateTable();
  });
  $("#clear-all-month").on('click', function(ee) {
    modelDeleteDates();
    viewDates();
    viewUpdateTable();
  });

  // define exact match filter callbacks
  var filters = GenboreeExrnaAt.filters; // subset of column names
  GenboreeExrnaAt.filterValues = {};
  GenboreeExrnaAt.filterToColumn = {};
  for (var ii = 0; ii < filters.length; ii++) {
    var filter = filters[ii];
    var downcaseFilter = filter.toLowerCase();
    var filterId = downcaseFilter.replace(/\s/g, "-");
    GenboreeExrnaAt.filterToColumn[filterId] = filter;

    // for each filter, define action for add button
    $("#add-" + filterId).on('click', function(ee) {
      // @todo attempting to use filterId here results in the final value of filterId being used
      var targetFilterId = ee.target.getAttribute("data-id");
      controlAddFilter(targetFilterId);
      viewDisplayFilterValues(targetFilterId);
      modelAddDtFilter(targetFilterId);
      viewUpdateTable();
    });

    // for each filter, define action for clear button
    $("#clear-" + filterId).on('click', function(ee) {
      var targetFilterId = ee.target.getAttribute("data-id");
      modelDeleteExatFilter(targetFilterId);
      viewDisplayFilterValues(targetFilterId);
      modelDeleteDtFilter(targetFilterId);
      viewUpdateTable();
    });
  }

  // add clear all filters button handler
  // @todo this actually triggers many updates and so may be slow but is fast enough
  $("#clear-all-filters").on('click', function(ee) {
    $("#clear-all-month").click();
    for (filterId in GenboreeExrnaAt.filterToColumn) {
      $("#clear-" + filterId).click();
    }
  });

  $(window).on("resize", resizeHandler);
});
