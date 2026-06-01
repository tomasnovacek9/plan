function forceCurrentWeekOnStartV84(){
  if(typeof setWeekByDate === "function"){
    setWeekByDate(new Date());
  }

  if(typeof importWeekFromCalendar === "function"){
    importWeekFromCalendar();
  }

  if(typeof renderAll === "function"){
    renderAll();
  }
}

window.addEventListener("load",()=>{
  setTimeout(forceCurrentWeekOnStartV84, 700);
  setTimeout(forceCurrentWeekOnStartV84, 1600);
});
