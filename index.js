const textarea = document.getElementById('input');
const button = document.getElementById('button');

button.addEventListener('click', () => {
  getICS(
    parseYaString(textarea.value)
  );
  console.log(parseYaString(textarea.value));
});

function getICS (schedule) {
  var calendar = ics();
  schedule.forEach((lesson) => {
    calendar.addEvent(
      lesson.title,
      lesson.teachers,
      lesson.place,
      lesson.startDate,
      lesson.endDate
    );
  });
  calendar.download('SHRI_2017');
}

function parseYaString (input) {
  const monthByString = {
    'июля': '07',
    'августа': '08',
  };

  const lineBlocks = input.split('\n\n');

  const now = new Date();

  const parsedSchedule = lineBlocks.map(lineBlock => {
    const lines = lineBlock.split('\n');
    const [ title, dateAndPlaceLine, ...teachers ] = lines;
    const dateAndPlaceArr = dateAndPlaceLine.split(', ');
    const [ dateString, timeString, place ] = dateAndPlaceArr;

    const [ day, monthString ] = dateString.split(' ');

    return {
      title,
      teachers: teachers.toString(),
      place,
      startDate: new Date(`${monthByString[monthString]}/${day}/2017 ${timeString}`),
    }
  });
  return addEndDate(parsedSchedule);
}

function addEndDate(schedule) {
  // разбиваем в группы по дням
  // если в дне одна лекция - ставим продолжительность 2 часа
  // если больше, то идем с конца, последней ставим 2 часа, каждой предыдущей, если она начинается менее чем за
  // 2 часа до начала предыдущей ставим продолжительность равную промежутку между ее началом и началом предыдущей.
  // в противном случае ставим 2 часа.
  const DEFAULT_LESSON_DURATION = 120 * 60 * 1000;

  const lessonsByDay = schedule.reduce((acc, next) => {
    const day = next.startDate.getDate();
    const month = next.startDate.getMonth();
    const key = day + '_' + month;
    if (!acc[key]) {
      acc[key] = [next];
    } else {
      acc[key].push(next);
    }
    return acc;
  }, {});

  Object.keys(lessonsByDay).forEach(key => {
    const last = lessonsByDay[key].length - 1
    for (let i = last; i >= 0; i--) {
      const lesson = lessonsByDay[key][i];
      if (i === last) {
        lesson.endDate = (new Date(lesson.startDate.getTime() + DEFAULT_LESSON_DURATION));
      } else {
        const lessonAfter = lessonsByDay[key][i + 1];
        if (lessonAfter.startDate.getTime() - lesson.startDate.getTime() < DEFAULT_LESSON_DURATION) {
          lesson.endDate = lessonAfter.startDate;
        } else {
          lesson.endDate = (new Date(lesson.startDate.getTime() + DEFAULT_LESSON_DURATION));
        }
      }
    }
  });

  return Object.keys(lessonsByDay).reduce((acc, key) => {
    return acc.concat(lessonsByDay[key]);
  }, []);
}
