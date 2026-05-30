import { useEffect, useRef, useState } from "react";
import "./App.css";

type PhotoItem = {
  id: number;
  name: string;
  done: boolean;
  image?: string;
};

type Project = {
  id: number;
  date: string;
  projectName: string;
  siteName: string;
  members: string[];
  car: string;
  isMine: boolean;
  photos: PhotoItem[];
};

const memberOptions = ["田中", "佐藤", "鈴木", "山本"];
const carOptions = ["ハイエース", "キャラバン", "ハイゼット"];

const initialProjects: Project[] = [
  {
    id: 1,
    date: "2024-05-14",
    projectName: "空調清掃",
    siteName: "立川第一小学校",
    members: ["田中（L）", "佐藤", "鈴木"],
    car: "ハイエース",
    isMine: true,
    photos: [
      { id: 1, name: "作業前（全体）", done: false },
      { id: 2, name: "排水溝", done: false },
      { id: 3, name: "作業後", done: false },
      { id: 4, name: "ゴミ置き場", done: false },
    ],
  },
  {
    id: 2,
    date: "2024-05-14",
    projectName: "排水管洗浄",
    siteName: "グリーンマンション立川",
    members: ["田中（L）", "山本"],
    car: "ハイゼット",
    isMine: false,
    photos: [],
  },
  {
    id: 3,
    date: "2024-05-17",
    projectName: "定期清掃",
    siteName: "国立第二小学校",
    members: ["佐藤", "鈴木"],
    car: "キャラバン",
    isMine: true,
    photos: [],
  },
];

const STORAGE_KEY = "building-maintenance-projects";


function App() {
  const [projects, setProjects] = useState<Project[]>(() => {
    const savedProjects = localStorage.getItem(STORAGE_KEY);
    return savedProjects ? JSON.parse(savedProjects) : initialProjects;
  });
  const [activeTab, setActiveTab] = useState<"today" | "calendar">("calendar");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [shootingPhoto, setShootingPhoto] = useState<PhotoItem | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<PhotoItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedCar, setSelectedCar] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editSiteName, setEditSiteName] = useState("");
  const [editProjectName, setEditProjectName] = useState("");
  const [editMembers, setEditMembers] = useState<string[]>([]);
  const [editCar, setEditCar] = useState("");
  const [capturedImage, setCapturedImage] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedProject =
  projects.find((project) => project.id === selectedProjectId) ?? null;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (!selectedProject || !shootingPhoto || capturedPhoto) return;
  
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
          },
          audio: false,
        });
  
        streamRef.current = stream;
  
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        alert("カメラを起動できませんでした");
        console.error(error);
      }
    };
  
    startCamera();
  
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [selectedProject, shootingPhoto, capturedPhoto]);

  

  const displayedProjects =
  selectedDate === null
    ? projects.filter((project) => project.date === "2024-05-14")
    : projects.filter((project) => project.date === selectedDate);


  const saveCapturedPhoto = () => {
    if (!selectedProject || !shootingPhoto) return;

    let capturedImage = "";

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");

      if (context) {
        context.drawImage(video, 0, 0);
        capturedImage = canvas.toDataURL("image/jpeg");
        setCapturedImage(capturedImage);
      }
    }

    setProjects((currentProjects) =>
      currentProjects.map((project) => {
        if (project.id !== selectedProject.id) return project;

        return {
          ...project,
          photos: project.photos.map((photo) =>
            photo.id === shootingPhoto.id
              ? { ...photo, done: true, image: capturedImage }
              : photo
          ),
        };
      })
    );

    setCapturedPhoto(false);
    setShootingPhoto(null);
  };

  if (isAddingProject) {
    return (
      <div className="app">
        <header className="detailHeader">
          <button onClick={() => setIsAddingProject(false)}>←戻る</button>
          <div>
            <h1>案件追加</h1>
            <p>{selectedDate ?? "2024-05-14"}</p>
          </div>
        </header>
  
        <main className="content">
          <section className="formCard">
            <label>
              現場名
              <input
                value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
                placeholder="例：新宿第一小学校"
              />
            </label>
  
            <label>
              案件名
              <input
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="例：トイレ清掃"
              />
            </label>
  
            <label>
              メンバー
              <div className="memberSelector">
                {memberOptions.map((member) => (
                  <button
                    key={member}
                    type="button"
                    className={
                      selectedMembers.includes(member)
                        ? "memberChip active"
                        : "memberChip"
                    }
                    onClick={() => {
                      if (selectedMembers.includes(member)) {
                        setSelectedMembers(
                          selectedMembers.filter((m) => m !== member)
                        );
                      } else {
                        setSelectedMembers([...selectedMembers, member]);
                      }
                    }}
                  >
                    {member}
                  </button>
                ))}
              </div>
            </label>
  
            <label>
              車両
              <div className="carSelector">
                {carOptions.map((car) => (
                  <button
                    key={car}
                    type="button"
                    className={
                      selectedCar === car
                        ? "carChip active"
                        : "carChip"
                    }
                    onClick={() => setSelectedCar(car)}
                  >
                    {car}
                  </button>
                ))}
              </div>
            </label>
  
            <button
              className="saveProjectButton"
              onClick={() => {
                if (!newSiteName || !newProjectName) return;
  
                const newProject: Project = {
                  id: Date.now(),
                  date: selectedDate ?? "2024-05-14",
                  siteName: newSiteName,
                  projectName: newProjectName,
                  members: selectedMembers,
                  car: selectedCar,
                  isMine: true,
                  photos: [],
                };
  
                setProjects((currentProjects) => [...currentProjects, newProject]);
  
                setNewSiteName("");
                setNewProjectName("");
                setIsAddingProject(false);
              }}
            >
              保存する
            </button>
          </section>
        </main>
      </div>
    );
  }

  const editingProject =
  projects.find((project) => project.id === editingProjectId) ?? null;

if (editingProject) {
  return (
    <div className="app">
      <header className="detailHeader">
        <button onClick={() => setEditingProjectId(null)}>←</button>
        <div>
          <h1>案件編集</h1>
          <p>{editingProject.date}</p>
        </div>
      </header>

      <main className="content">
        <section className="formCard">
          <label>
            現場名
            <input
              value={editSiteName}
              onChange={(e) => setEditSiteName(e.target.value)}
            />
          </label>

          <label>
            案件名
            <input
              value={editProjectName}
              onChange={(e) => setEditProjectName(e.target.value)}
            />
          </label>

          <label>
            メンバー
            <div className="memberSelector">
              {memberOptions.map((member) => (
                <button
                  key={member}
                  type="button"
                  className={
                    editMembers.includes(member)
                      ? "memberChip active"
                      : "memberChip"
                  }
                  onClick={() => {
                    if (editMembers.includes(member)) {
                      setEditMembers(editMembers.filter((m) => m !== member));
                    } else {
                      setEditMembers([...editMembers, member]);
                    }
                  }}
                >
                  {member}
                </button>
              ))}
            </div>
          </label>

          <label>
            車両
            <div className="carSelector">
              {carOptions.map((car) => (
                <button
                  key={car}
                  type="button"
                  className={editCar === car ? "carChip active" : "carChip"}
                  onClick={() => setEditCar(car)}
                >
                  {car}
                </button>
              ))}
            </div>
          </label>

          <button
            className="saveProjectButton"
            onClick={() => {
              setProjects((currentProjects) =>
                currentProjects.map((project) =>
                  project.id === editingProject.id
                    ? {
                        ...project,
                        siteName: editSiteName,
                        projectName: editProjectName,
                        members: editMembers,
                        car: editCar,
                      }
                    : project
                )
              );

              setEditingProjectId(null);
            }}
          >
            保存する
          </button>
        </section>
      </main>
    </div>
  );
}

  if (previewPhoto) {
    return (
      <div className="previewScreen">
        <div className="previewHeader">
          <button onClick={() => setPreviewPhoto(null)}>←戻る</button>
        </div>

        <div className="previewImageWrap">
          <img src={previewPhoto.image} alt="" className="previewImage" />
        </div>

        <div className="previewInfo">
          <h2>{previewPhoto.name}</h2>
          <p>写真を拡大確認できます</p>
        </div>
      </div>
    );
  }

  if (selectedProject && shootingPhoto && capturedPhoto) {
    return (
      <div className="cameraScreen">
        <div className="cameraTop">
          <button onClick={() => setCapturedPhoto(false)}>←戻る</button>
        </div>

        <div className="cameraPreview">
          <img
            src={capturedImage}
            alt=""
            className="cameraVideo"
          />
          <div className="digitalBoard">
            <div>
              <span>現場名</span>
              <strong>{selectedProject.siteName}</strong>
            </div>
            <div>
              <span>案件名</span>
              <strong>{selectedProject.projectName}</strong>
            </div>
            <h2>{shootingPhoto.name}</h2>
            <p>撮影日 2024.05.14</p>
          </div>
        </div>

        <div className="confirmButtons">
          <button className="retakeButton" onClick={() => setCapturedPhoto(false)}>
            再撮影
          </button>
          <button className="okButton" onClick={saveCapturedPhoto}>
            OK
          </button>
        </div>
      </div>
    );
  }

  if (selectedProject && shootingPhoto) {
    return (
      <div className="cameraScreen">
        <div className="cameraTop">
          <button onClick={() => setShootingPhoto(null)}>×</button>
          <span>⚡</span>
        </div>

        <div className="cameraPreview">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="cameraVideo"
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div className="digitalBoard">
            <div>
              <span>現場名</span>
              <strong>{selectedProject.siteName}</strong>
            </div>
            <div>
              <span>案件名</span>
              <strong>{selectedProject.projectName}</strong>
            </div>
            <h2>{shootingPhoto.name}</h2>
            <p>撮影日 2024.05.14</p>
          </div>
        </div>

        <div className="cameraBottom">
          <button className="galleryButton">□</button>
          <button className="shutterButton" onClick={() => setCapturedPhoto(true)}>
            ●
          </button>
          <button className="settingButton">⚙</button>
        </div>
      </div>
    );
  }

  if (selectedProject) {
    const completedCount = selectedProject.photos.filter((photo) => photo.done).length;
    const totalCount = selectedProject.photos.length;
    const progressPercent = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

    return (
      <div className="app">
        <header className="detailHeader">
          <button onClick={() => setSelectedProjectId(null)}>←戻る</button>
          <div>
            <h1>{selectedProject.siteName}</h1>
            <p>{selectedProject.projectName}</p>
          </div>
        </header>

        <main className="content">
          <section className="photoProgressCard">
            <div className="photoProgressText">
              <span>撮影状況</span>
              <strong>{completedCount} / {totalCount} 撮影済み</strong>
            </div>

            <div className="photoProgressBar">
              <div className="photoProgressFill" style={{ width: `${progressPercent}%` }} />
            </div>
          </section>

          <section className="photoList">
            {selectedProject.photos.map((photo) => (
              <button key={photo.id} className="photoItem" onClick={() => setShootingPhoto(photo)}>
                <div className="photoLeft">
                  <div className={`checkCircle ${photo.done ? "done" : ""}`}>
                    {photo.done ? "✓" : ""}
                  </div>

                  <div>
                    <h3>{photo.name}</h3>
                    <p>{photo.done ? "撮影済み" : "未撮影"}</p>
                  </div>
                </div>

                {photo.image ? (
                  <img
                    src={photo.image}
                    alt=""
                    onClick={(event) => {
                      event.stopPropagation();
                      setPreviewPhoto(photo);
                    }}
                  />
                ) : (
                  <div className="emptyThumb">未</div>
                )}
              </button>
            ))}
          </section>
          <button
            className="addPhotoButton"
            onClick={() => {
              const photoName = prompt("追加する写真項目名");

              if (!photoName || !selectedProject) return;

              setProjects((currentProjects) =>
                currentProjects.map((project) => {
                  if (project.id !== selectedProject.id) return project;

                  return {
                    ...project,
                    photos: [
                      ...project.photos,
                      {
                        id: Date.now(),
                        name: photoName,
                        done: false,
                      },
                    ],
                  };
                })
              );
            }}
          >
            ＋ 項目追加
          </button>
        </main>
      </div>
    );
  }

  const renderProjectCards = (list: Project[]) => (
    <section className="projectList">
      {list.map((project) => (
        <article
          key={project.id}
          className={`projectCard ${project.isMine ? "mine" : ""}`}
          onClick={() => setSelectedProjectId(project.id)}
        >
          <div className="cardHeader">
            <h2>{project.siteName}</h2>

            <button
              className="editProjectButton"
              onClick={(event) => {
                event.stopPropagation();

                setEditSiteName(project.siteName);
                setEditProjectName(project.projectName);
                setEditMembers(project.members);
                setEditCar(project.car);
                setEditingProjectId(project.id);
              }}
            >
              編集
            </button>
          </div>

          <div className="projectInfo">
            <div className="infoRow">
              <span className="label">案件名</span>
              <span className="value">{project.projectName}</span>
            </div>

            <div className="infoRow">
              <span className="label">メンバー</span>
              <span className="value">{project.members.join("、")}</span>
            </div>

            <div className="infoRow">
              <span className="label">車両</span>
              <span className="value">{project.car}</span>
            </div>
          </div>
        </article>
      ))}
    </section>
  );

  return (
    <div className="app">
      <header className="appHeader">
        {activeTab === "today" && (
          <button
            className="backToCalendarButton"
            onClick={() => setActiveTab("calendar")}
          >
            ← 戻る
          </button>
        )}

        <h1>
          {activeTab === "today"
            ? selectedDate ?? "2024-05-14"
            : "予定表"}
        </h1>

        {activeTab === "calendar" && <p>2024年5月</p>}
      </header>

      <main className="content">
                {activeTab === "today" ? (
            <>
              {displayedProjects.length > 0 ? (
                renderProjectCards(displayedProjects)
              ) : (
                <section className="emptyProjectCard">
                  <p>この日の案件はありません</p>
                  <span>必要な場合は案件を追加してください</span>
                </section>
              )}

          <button
            className="addProjectButton"
            onClick={() => setIsAddingProject(true)}
          >
            ＋案件追加
          </button>
            </>
          ) : (
          <section className="calendarCard">
            <div className="calendarGrid calendarWeek">
              {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            <div className="calendarGrid">
              {Array.from({ length: 35 }, (_, index) => {
                const day = index - 2;
                const date = `2024-05-${String(day).padStart(2, "0")}`;
                const dayProjects = projects.filter((project) => project.date === date);

                return (
                  <button
                    key={index}
                    className={`calendarDay ${day === 14 ? "today" : ""}`}
                    onClick={() => {
                      if (day > 0 && day <= 31) {
                        const clickedDate = `2024-05-${String(day).padStart(2, "0")}`;
                        setSelectedDate(clickedDate);
                        setActiveTab("today");
                      }
                    }}
                  >
                    {day > 0 && day <= 31 && (
                      <>
                        <span className="dayNumber">{day}</span>
                        {dayProjects.map((project) => (
                          <button
                            key={project.id}
                            className={`calendarEvent ${project.isMine ? "mineEvent" : ""}`}
                          >
                            {project.siteName}
                          </button>
                        ))}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <nav className="bottomNav">
        <button
          className={activeTab === "calendar" ? "active" : ""}
          onClick={() => setActiveTab("calendar")}
        >
          予定表
        </button>

        <button>メニュー</button>
      </nav>
    </div>
  );
}

export default App;