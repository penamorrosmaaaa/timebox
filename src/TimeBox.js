import React, { useState } from "react";
import "./TimeBox.css";

/** 
 * We’ll store data as:
 * timeBoxData[dateString] = {
 *   priorities: [...],
 *   brainDump: [...],
 *   schedule: { "7:00 AM": "...", "7:30 AM": "...", "8:00 AM": "...", ... }
 * }
 * The big change is how we render the schedule table.
 */

// Helper to format hour/minute in 12-hour AM/PM
function formatTime(hour, minute) {
  let suffix = "AM";
  let displayHour = hour;

  if (hour === 0) {
    displayHour = 12; // midnight
  } else if (hour === 12) {
    suffix = "PM";
  } else if (hour > 12) {
    displayHour = hour - 12;
    suffix = "PM";
  }

  const minStr = minute === 0 ? "00" : String(minute);
  return `${displayHour}:${minStr} ${suffix}`;
}

// Format Date object -> 'YYYY-MM-DD'
function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date)) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Get next day (used for Brain Dump carry-over, etc.)
function getNextDay(date) {
  return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}

export default function TimeBox() {
  const [timeBoxData, setTimeBoxData] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentDateStr = formatDate(currentDate);
  if (!timeBoxData[currentDateStr]) {
    timeBoxData[currentDateStr] = {
      priorities: ["", "", ""],
      brainDump: [],
      schedule: {}
    };
  }

  const { priorities, brainDump, schedule } = timeBoxData[currentDateStr];

  // ----- BASIC HANDLERS (like before) ----- //

  function handlePriorityChange(index, value) {
    const newData = { ...timeBoxData };
    newData[currentDateStr].priorities[index] = value;
    setTimeBoxData(newData);
  }

  function addBrainDumpItem() {
    const newData = { ...timeBoxData };
    newData[currentDateStr].brainDump.push({ text: "", completed: false });
    setTimeBoxData(newData);
  }
  function updateBrainDumpText(i, value) {
    const newData = { ...timeBoxData };
    newData[currentDateStr].brainDump[i].text = value;
    setTimeBoxData(newData);
  }
  function toggleBrainDumpCompleted(i) {
    const newData = { ...timeBoxData };
    newData[currentDateStr].brainDump[i].completed =
      !newData[currentDateStr].brainDump[i].completed;
    setTimeBoxData(newData);
  }
  function moveIncompleteBrainDump() {
    const newData = { ...timeBoxData };
    const items = newData[currentDateStr].brainDump;
    const incomplete = items.filter((it) => !it.completed);
    if (!incomplete.length) return;

    const nextDateStr = formatDate(getNextDay(currentDate));
    if (!newData[nextDateStr]) {
      newData[nextDateStr] = {
        priorities: ["", "", ""],
        brainDump: [],
        schedule: {}
      };
    }
    // Move them over (reset completed = false if you want)
    newData[nextDateStr].brainDump.push(...incomplete.map((x) => ({ ...x })));
    // Remove from today
    newData[currentDateStr].brainDump = items.filter((it) => it.completed);
    setTimeBoxData(newData);
  }

  // ----- NEW SCHEDULE RENDERING ----- //

  /**
   * For each hour from 7..23 (which is 11 PM), we show TWO columns: :00, :30.
   * We store text in schedule["7:00 AM"], schedule["7:30 AM"], etc.
   */
  const hours = [];
  for (let h = 7; h < 24; h++) {
    hours.push(h);
  }

  function updateSlotValue(label, newValue) {
    const newData = { ...timeBoxData };
    newData[currentDateStr].schedule[label] = newValue;
    setTimeBoxData(newData);
  }

  // ----- DATE NAVIGATION ----- //
  function handleDateChange(e) {
    const newD = new Date(e.target.value);
    if (!isNaN(newD.getTime())) {
      setCurrentDate(newD);
    }
  }
  function goPrevDay() {
    setCurrentDate(new Date(currentDate.getTime() - 86400000));
  }
  function goNextDay() {
    setCurrentDate(new Date(currentDate.getTime() + 86400000));
  }

  return (
    <div className="timebox-container">
      {/* LEFT COLUMN */}
      <div className="timebox-left">
        <div className="timebox-logo">The Time Box.</div>

        <div className="timebox-top-priorities">
          <label className="timebox-label">Top Priorities</label>
          {priorities.map((p, idx) => (
            <input
              key={idx}
              type="text"
              className="timebox-priority-input"
              value={p}
              onChange={(e) => handlePriorityChange(idx, e.target.value)}
              placeholder={`Priority ${idx + 1}`}
            />
          ))}
        </div>

        <div className="timebox-brain-dump">
          <label className="timebox-label">Brain Dump</label>
          {brainDump.map((item, idx) => (
            <div key={idx} className="brain-dump-row">
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => toggleBrainDumpCompleted(idx)}
              />
              <input
                type="text"
                className="brain-dump-input"
                value={item.text}
                onChange={(e) => updateBrainDumpText(idx, e.target.value)}
                placeholder="Type an idea..."
              />
            </div>
          ))}
          <button onClick={addBrainDumpItem} className="brain-dump-add-btn">
            + Add
          </button>
          <button onClick={moveIncompleteBrainDump} className="brain-dump-move-btn">
            Move Incomplete → Next Day
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="timebox-right">
        {/* Date Controls */}
        <div className="timebox-header">
          <label>Date</label>
          <input
            type="date"
            value={formatDate(currentDate)}
            onChange={handleDateChange}
          />
          <button onClick={goPrevDay}>&lt;</button>
          <button onClick={goNextDay}>&gt;</button>
        </div>

        {/* SCHEDULE TABLE (split into :00 and :30 columns) */}
        <div className="timebox-schedule">
          <table>
            <thead>
              <tr>
                <th className="hour-col">Hour</th>
                <th className="split-col">:00</th>
                <th className="split-col">:30</th>
              </tr>
            </thead>
            <tbody>
              {hours.map((h) => {
                // Convert 24-hr to 12-hr label (7..23)
                let suffix = "AM";
                let dispHour = h;
                if (h === 0) dispHour = 12;
                else if (h === 12) suffix = "PM";
                else if (h > 12) {
                  dispHour = h - 12;
                  suffix = "PM";
                }
                const hourLabel = `${dispHour} ${suffix}`;

                // Build keys for :00 and :30
                const label00 = formatTime(h, 0);   // e.g. "7:00 AM"
                const label30 = formatTime(h, 30);  // e.g. "7:30 AM"
                return (
                  <tr key={h}>
                    <td className="hour-col">{hourLabel}</td>
                    {/* :00 column */}
                    <td className="split-col">
                      <input
                        type="text"
                        value={schedule[label00] || ""}
                        onChange={(e) => updateSlotValue(label00, e.target.value)}
                        placeholder="Task..."
                      />
                    </td>
                    {/* :30 column */}
                    <td className="split-col">
                      <input
                        type="text"
                        value={schedule[label30] || ""}
                        onChange={(e) => updateSlotValue(label30, e.target.value)}
                        placeholder="Task..."
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
T