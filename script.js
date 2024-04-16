/*
**********************************************************
1. 지도 생성 & 확대 축소 컨트롤러
https://apis.map.kakao.com/web/sample/addMapControl/

*/

var container = document.getElementById("map"); //지도를 담을 영역의 DOM 레퍼런스
var options = {
  //지도를 생성할 때 필요한 기본 옵션
  center: new kakao.maps.LatLng(37.54, 126.96), //지도의 중심좌표. 서울 한가운데
  level: 8, //지도의 레벨(확대, 축소 정도) 3에서 8레벨로 확대
};

var map = new kakao.maps.Map(container, options); //지도 생성 및 객체 리턴

// 지도에 확대 축소 컨트롤을 생성
let zoomControl = new kakao.maps.ZoomControl();

// 지도의 우측에 확대 축소 컨트롤을 추가
map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

// 데이터 준비 : 서버에서 저장되는 데이터를 불러서 쓰는데, 지금은 local에서 더미데이터를 만든다.
// 유튜브 영상 링크 => 내꺼?
// 3개 데이터 넣기

/*
**********************************************************
2. 더미데이터 준비하기 (제목, 주소, url, 카테고리)
*/
const dataSet = [
  {
    title: "희락돈까스",
    address: "서울 영등포구 양산로 210",
    url: "https://www.youtube.com/watch?v=2ZBmpw23ZC4",
    category: "양식",
  },
  {
    title: "즉석우동짜장",
    address: "서울 영등포구 대방천로 260",
    url: "https://www.youtube.com/watch?v=2ZBmpw23ZC4",
    category: "한식",
  },
  {
    title: "아카사카",
    address: "서울 서초구 서초대로74길 23",
    url: "https://www.youtube.com/watch?v=2ZBmpw23ZC4",
    category: "일식",
  },
];

/*
**********************************************************
3. 여러개 마커 찍기
  * 주소 - 좌표 변환
https://apis.map.kakao.com/web/sample/multipleMarkerImage/ (여러개 마커)
https://apis.map.kakao.com/web/sample/addr2coord/ (주소로 장소 표시하기)
*/
// 주소 - 좌표 변환 함수 (비동기 문제 발생 해결) ****************
// 주소-좌표 변환 객체를 생성합니다

// Geocoder: 서비스 라이브러리를 불러와야한다. <script> 태그에서 src에 &libraries=services 추가함
var geocoder = new kakao.maps.services.Geocoder();

// async function setMap() {
//   for (var i = 0; i < dataSet.length; i++) {
//     // getCoordsByAddress 주소를 좌표로 변환하는 코드를 반복문안에 넣어준다.
//     let position = await getCoordsByAddress(dataSet[i].address);
//     console.log(position);

//     // 마커를 생성합니다
//     var marker = new kakao.maps.Marker({
//       map: map, // 마커를 표시할 지도
//       // position: positions[i].latlng, // 마커를 표시할 위치
//       position: position,
//       // title: positions[i].title, // 마커의 타이틀, 마커에 마우스를 올리면 타이틀이 표시됩니다
//     });
//   }
// }

async function setMap() {
  for (var i = 0; i < dataSet.length; i++) {
    let position = await getCoordsByAddress(dataSet[i].address);

    // 마커를 생성합니다
    var marker = new kakao.maps.Marker({
      map: map, // 마커를 표시할 지도
      position: position, // 마커를 표시할 위치
    });

    // 마커에 표시할 인포윈도우를 생성합니다
    var infowindow = new kakao.maps.InfoWindow({
      content: getContent(dataSet[i]), // 인포윈도우에 표시할 내용
      disableAutoPan: true, // 인포윈도우를 열 때 지도가 자동으로 패닝하지 않을지의 여부 (기본값: false)
    });

    infowindowArray.push(infowindow);

    // 마커에 mouseover 이벤트와 mouseout 이벤트를 등록합니다
    // 이벤트 리스너로는 클로저를 만들어 등록합니다
    // for문에서 클로저를 만들어 주지 않으면 마지막 마커에만 이벤트가 등록됩니다
    kakao.maps.event.addListener(
      marker,
      "click",
      makeOverListener(map, marker, infowindow, position)
    );
    // 커스텀: 맵을 클릭하면 현재 나타난 인포윈도우가 없어지게끔
    kakao.maps.event.addListener(map, "click", makeOutListener(infowindow));
  }
}

function getContent(data) {
  // 유튜브 섬네일 id 가져오기
  let replaceUrl = data.url;
  let finUrl = "";
  replaceUrl = replaceUrl.replace("https://youtu.be/", "");
  replaceUrl = replaceUrl.replace("https://www.youtube.com/embed/", "");
  replaceUrl = replaceUrl.replace("https://www.youtube.com/watch?v=", "");
  finUrl = replaceUrl.split("&")[0];

  // 인포윈도우 가공하기
  return `
  <div class="infowindow">
      <div class="infowindow-img-container">
        <img
          src="https://img.youtube.com/vi/${finUrl}/mqdefault.jpg"
          class="infowindow-img"
        />
      </div>
      <div class="infowindow-body">
        <h5 class="infowindow-title">${data.title}</h5>
        <p class="infowindow-address">${data.address}</p>
        <a href="${data.url}" class="infowindow-btn" target="_blank">영상이동</a>
      </div>
    </div>
  `;
}

// 인포윈도우를 표시하는 클로저를 만드는 함수입니다
/* 
  커스텀
  1. 클릭시 다른 인포윈도우 닫기
  2. 클릭한 곳으로 지도 중심 이동하기
  */
// 커스텀
// 1. 클릭시 다른 인포윈도우 닫기
let infowindowArray = [];
function closeInfowindow() {
  for (let infowindow of infowindowArray) {
    infowindow.close();
  }
}

// 인포윈도우를 닫는 클로저를 만드는 함수입니다
function makeOutListener(infowindow) {
  return function () {
    infowindow.close();
  };
}

function makeOverListener(map, marker, infowindow, position) {
  return function () {
    // 1. 클릭시 다른 인포윈도우 닫기
    closeInfowindow();
    infowindow.open(map, marker);
    // 2. 클릭한 곳으로 짇 중심 이동하기
    map.panTo(position);
  };
}

function getCoordsByAddress(address) {
  // promise 형태로 반환
  return new Promise((resolve, reject) => {
    // 주소로 좌표를 검색합니다
    geocoder.addressSearch(address, function (result, status) {
      // 정상적으로 검색이 완료됐으면
      if (status === kakao.maps.services.Status.OK) {
        var coords = new kakao.maps.LatLng(result[0].y, result[0].x);
        return resolve(coords);
      }
      reject(new Error("getCoordsByAddress Error: not valid Address"));
    });
  });
}

setMap();

// 마케===
