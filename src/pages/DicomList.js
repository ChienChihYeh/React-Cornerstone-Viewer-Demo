//this should not be a container for child components

import React, { useEffect, useRef, useState } from "react";
import $, { error } from "jquery";
import "datatables.net";
import "datatables.net-dt";
import "datatables.net-dt/css/jquery.dataTables.min.css"; // Import DataTable CSS
import "./../styles/styles.scss";

function DicomList() {
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [isInit, setIsInit] = useState(false);

  const tableRef = useRef(null);
  const minRef = useRef(null);
  const maxRef = useRef(null);
  const markedCaseRef = useRef([]);
  const unmarkedCaseRef = useRef([]);

  useEffect(() => {
    const dataTable = $("#patient-list").DataTable({
      processing: true,
      serverSide: true,
      ajax: {
        url: "http://192.168.0.11:18000/mongoajax",
        type: "POST",
        dataSrc: function (json) {
          //Make your callback here.

          return json.data;
        },
        data: function (d) {
          d.minDate = $(minRef.current).val();
          d.maxDate = $(maxRef.current).val();
          d.marked = markedCaseRef.current.join(",");
          d.unmarked = unmarkedCaseRef.current.join(",");
          markedCaseRef.current = [];
          unmarkedCaseRef.current = [];
          // markedCase = [];
          // unmarkedCase = [];
          return d;
        },
      },
      columns: [
        {
          title: "Mark",
          render: function (data, type, row, meta) {
            // console.log(row);
            if (data === "true") {
              return `<input
                  type="checkbox"
                  className="mark-case"
                  checked
                />`;
            } else if (data === "false") {
              return `<input type="checkbox" class="mark-case">`;
            } else return "";
          },
        },
        { title: "Index" },
        { title: "PatientID" },
        { title: "PatientName" },
        { title: "Age" },
        { title: "Gender" },
        { title: "StudyDate" },
        { title: "Processing" },
        { title: "AccessionNumber" },
        { title: "LungRADS,  NoduleNum" },
        { title: "CAC-Scores" },
      ],
      stateSave: true,
      columnDefs: [
        {
          className: "text-center",
          targets: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        },
        { width: "20%", targets: [2, 3] },
        { width: "5%", targets: [4] },
        { searchable: false, targets: [0, 8] },
        { visible: false, targets: 8 },
      ],
      order: [[9, "desc"]],
      dom: "<f><t><lp>i",
      initComplete: function () {
        console.log("initComplete");
      },
    });

    dataTable.on("click", "tbody tr td", function (e) {
      if ($(e.currentTarget).index() === 0) {
        if (e.target.type === "checkbox") {
          console.log("clicked on checkbox"); //ok
          let index = $(e.currentTarget).next().text();
          // console.log(index); //ok
          if ($(e.target).prop("checked")) {
            console.log("checked");
            if (!markedCaseRef.current.includes(index)) {
              markedCaseRef.current.push(index);
              console.log(markedCaseRef.current);
            }
          } else {
            console.log("not checked");
            if (markedCaseRef.current.includes(index)) {
              markedCaseRef.current = markedCaseRef.current.filter(
                (item) => item !== index
              );
              console.log("removed", index);
              console.log(markedCaseRef.current);
            } else {
              unmarkedCaseRef.current.push(index);
              console.log(unmarkedCaseRef.current);
            }
          }
          dataTable.ajax.reload(null, false);
        }
        return null;
      } else {
        console.log(
          dataTable.row(this).data()[6],
          dataTable.row(this).data()[2],
          dataTable.row(this).data()[8]
        );
        window.location.href = `/cornerstoneajax/${
          dataTable.row(this).data()[6]
        }/${dataTable.row(this).data()[2]}/${dataTable.row(this).data()[8]}`;
      }
    });

    dataTable.on("xhr.dt", function () {
      console.log("xhr.dt");
    });

    // reload the table data when minDate or maxDate change
    function TableReload() {
      dataTable.ajax.reload(null, false);
    }

    setInterval(TableReload, 10000);

    const min = minRef.current;
    const max = maxRef.current;

    // min.addEventListener("change", TableReload);
    // max.addEventListener("change", TableReload);

    return () => {
      dataTable.destroy();
      console.log("dataTable destroyed");
      clearInterval(TableReload);
      // min.removeEventListener("change", TableReload);
      // max.removeEventListener("change", TableReload);
    };
  }, []);

  function TableReload() {
    const dataTable = $("#patient-list").DataTable();
    dataTable.ajax.reload(null, false);
  }

  // function GetToday(setMinDate, TableReload) {
  function GetToday() {
    const dateToday = new Date();
    const dateTodayISO = dateToday.toISOString().slice(0, 10);
    $(minRef.current).val(dateTodayISO);
    setMinDate(dateTodayISO);

    // TableReload();
  }

  function GetYesterday() {
    const dateYesterday = new Date();
    dateYesterday.setDate(dateYesterday.getDate() - 1);
    const dateYesterdayISO = dateYesterday.toISOString().slice(0, 10);
    $(minRef.current).val(dateYesterdayISO);
    setMinDate(dateYesterdayISO);

    // TableReload();
  }

  function ResetDate() {
    $(minRef.current, maxRef.current).val("");
    setMinDate("");
    setMaxDate("");

    // TableReload();
  }

  useEffect(() => {
    if (isInit) {
      TableReload();
    } else {
      setIsInit(true);
    }
  }, [minDate, maxDate]);

  return (
    <>
      <h1 style={{ textAlign: "center" }}>
        {"React DataTable (Don't try this at home)"}
      </h1>
      <div
        style={{
          width: "90%",
          margin: "auto",
          position: "relative",
          minWidth: "1200px",
        }}
      >
        <span
          style={{ position: "absolute", top: "0", left: "0", zIndex: "10" }}
        >
          {"StudyDate from:"}{" "}
          <input
            type="date"
            name="min"
            ref={minRef}
            value={minDate}
            onChange={(e) => {
              setMinDate(e.target.value);
            }}
          />
          {" to: "}{" "}
          <input
            type="date"
            name="max"
            ref={maxRef}
            value={maxDate}
            onChange={(e) => {
              setMaxDate(e.target.value);
            }}
          />
          <button
            onClick={() => {
              GetToday();
            }}
          >
            Today
          </button>
          <button
            onClick={() => {
              GetYesterday();
            }}
          >
            Yesterday
          </button>
          <button
            onClick={() => {
              ResetDate();
            }}
          >
            Reset
          </button>
        </span>
        <table
          ref={tableRef}
          className="display"
          id="patient-list"
          style={{ width: "100%" }}
        ></table>
      </div>
    </>
  );
}

export default DicomList;
