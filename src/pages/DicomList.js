import React, { useEffect, useRef, useState } from "react";
import $, { error } from "jquery";
import "datatables.net";
import "datatables.net-dt";
import "datatables.net-dt/css/jquery.dataTables.min.css"; // Import DataTable CSS
import "./../styles/styles.scss";

function DicomList() {
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");

  const tableRef = useRef(null);
  const minRef = useRef(null);
  const maxRef = useRef(null);
  const todayRef = useRef(null);
  const yesterdayRef = useRef(null);
  const markedCaseRef = useRef([]);
  const unmarkedCaseRef = useRef([]);

  useEffect(() => {
    // axios
    //   .post("http://10.20.19.148:18000/checkworkqueue")
    //   .then((response) => {
    //     console.log("server response:" + JSON.stringify(response.data));
    //   })
    //   .catch((error) => {
    //     console.error("Error fetching data:", error);
    //   });

    const dataTable = $(tableRef.current).DataTable({
      processing: true,
      serverSide: true,
      ajax: {
        url: "http://10.20.19.148:18000/mongoajax",
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
            }
            return `<input type="checkbox" class="mark-case">`;
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
      order: [[9, "asc"]],
      dom: "<f><t><lp>i",
      initComplete: function () {
        console.log("initComplete");
      },
    });

    dataTable.on("click", "tbody tr td", function (e) {
      // console.log(e.currentTarget); //ok
      // console.log($(e.currentTarget).index()); //ok
      // console.log(e.target.type); // ok
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

    // reload the table data when minDate or maxDate change
    dataTable.on("xhr.dt", function () {
      console.log("xhr.dt");
    });

    const min = minRef.current;
    const max = maxRef.current;
    const today = todayRef.current;
    const yesterday = yesterdayRef.current;

    function TableReload() {
      dataTable.ajax.reload(null, false);
    }

    function GetToday() {
      const dateToday = new Date();
      const dateTodayISO = dateToday.toISOString().slice(0, 10);
      $(minRef.current).val(dateTodayISO);
      setMinDate(dateTodayISO);
      TableReload();
    }

    function GetYesterday() {
      const dateYesterday = new Date();
      dateYesterday.setDate(dateYesterday.getDate() - 1);
      const dateYesterdayISO = dateYesterday.toISOString().slice(0, 10);
      $(minRef.current).val(dateYesterdayISO);
      setMinDate(dateYesterdayISO);
      TableReload();
    }

    min.addEventListener("change", TableReload);
    max.addEventListener("change", TableReload);
    today.addEventListener("click", GetToday);
    yesterday.addEventListener("click", GetYesterday);

    setInterval(TableReload, 10000);

    return () => {
      dataTable.destroy();
      yesterday.removeEventListener("click", GetYesterday);
      today.removeEventListener("click", GetToday);
      min.removeEventListener("change", TableReload);
      max.removeEventListener("change", TableReload);
      clearInterval(TableReload);
    };
  }, []);

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
          <button ref={todayRef}>Today</button>
          <button ref={yesterdayRef}>Yesterday</button>
        </span>
        <table
          ref={tableRef}
          className="display"
          style={{ width: "100%" }}
        ></table>
      </div>
    </>
  );
}

export default DicomList;
