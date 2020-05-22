import { Component, OnInit, ViewChild, TemplateRef, OnDestroy } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { NgbModal, NgbModalConfig } from '@ng-bootstrap/ng-bootstrap';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  playlistForm: FormGroup;
  apiUrl = 'http://localhost:8001/';
  playlistHandler: any = {
    modelClose: null,
    isPlayListLoading: false,
    uploadedFileIsInValid: false,
    fileData: null,
    duration: null,
    playAudio: null,
    audioIsPlaying: {
      name: null
    },
    deleteFileName: null
  };
  displayedColumns = {
    headers: ['ALBUMN', 'DURATION', 'PLAY', 'DELETE'],
    columns: ['album', 'duration', 'play', 'delete']
  };
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild('playListSort', { static: true }) playListSort: MatSort;
  @ViewChild('confirmationModal', { static: true }) private confirmationModal: TemplateRef<any>;

  constructor(
    private http: HttpClient,
    private modalService: NgbModal,
    config: NgbModalConfig,
    private formBuilder: FormBuilder,
    private toastr: ToastrService
  ) {
    config.backdrop = 'static';
    config.keyboard = false;
  }

  ngOnInit() {
    this.playlistHandler.isPlayListLoading = true;
    this.playlistForm = this.formBuilder.group({
      name: ['', Validators.required],
      file: ['', Validators.required]
    });
    this.getUploadedFiles();

  }

  /**
   * Get uploaded files
   */
  getUploadedFiles() {
    this.http.get(`${this.apiUrl}getFiles`).subscribe(files => {
      this.updateTableData(files);
      this.playlistHandler.isPlayListLoading = false;
    });
  }

  /**
   * Play selected file
   * @param data file data
   */
  playfile(data) {
    if (this.playlistHandler.playAudio) {
      this.playlistHandler.audioIsPlaying = { name: null };
      this.playlistHandler.playAudio.pause();
      this.playlistHandler.playAudio = null;
    } else {
      this.playlistHandler.playAudio = new Audio('data:audio/x-wav;base64,' + data.base64);
      this.playlistHandler.audioIsPlaying = { name: data.filename };
      this.playlistHandler.playAudio.play();
    }
  }

  /**
   * Load data to table
   * @param files - files information
   */
  updateTableData(files) {
    const getfile: any = files;
    this.dataSource = new MatTableDataSource<any>(getfile.playlist);
    this.dataSource.sort = this.playListSort;
    this.dataSource.paginator = this.paginator;
  }

  /**
   * Open ngb modal windw
   * @param content - modal content reference
   */
  open(content, isDelete?: any) {
    if (!isDelete) {
      this.playlistHandler.fileData = null;
      this.playlistHandler.duration = null;
      this.playlistHandler.deleteFileName = null;
      this.playlistForm.reset();
    }
    this.playlistHandler.modelClose = this.modalService.open(content, {
      centered: true,
      size: 'lg'
    });
  }

  /**
   * Ngb Modal close
   */
  closeModal() {
    if (this.playlistHandler.modelClose) {
      this.playlistHandler.fileData = null;
      this.playlistHandler.duration = null;
      this.playlistHandler.deleteFileName = null;
      this.playlistHandler.modelClose.close();
    }
  }

  /**
   * Create playlist form submit
   */
  onSubmit() {
    if (this.playlistForm.invalid) {
      return;
    } else if (this.playlistHandler.uploadedFileIsInValid) {
      this.toastr.error('File is invalid');
      return;
    }

    // Check already data is exists or not
    let isExists = false;
    this.dataSource.data.forEach((elem) => {
      if (elem.filename === this.playlistHandler.fileData.name) {
        isExists = true;
      }
    });

    if (isExists) {
      this.toastr.warning('File already exists');
      return;
    }

    const formData = new FormData();
    const files: any = this.playlistHandler.fileData;
    formData.append('uploads[]', files, files.name);
    formData.append('album', this.playlistForm.value.name);
    formData.set('duration', this.playlistHandler.duration);
    this.http.post(`${this.apiUrl}upload`, formData).subscribe(file => {
      this.closeModal();
      this.toastr.success('Successfully uploaded!');
      this.updateTableData(file);
    });
  }

  /**
   * Check the uploaded is valid/invalid
   * @param fileData - uploaded file data
   */
  validateTheFile(fileData) {

    const audio = new Audio(URL.createObjectURL(fileData.item(0)));
    audio.addEventListener('loadeddata', () => {
      this.playlistHandler.duration = audio.duration.toFixed(2);
    });
    this.playlistHandler.uploadedFileIsInValid = false;
    const allowType = ['audio/wav', 'audio/ogg', 'audio/mp3'];
    if (allowType.indexOf(fileData[0].type) === -1) {
      this.playlistHandler.uploadedFileIsInValid = true;
      this.toastr.error('File is invalid');
    } else {
      this.playlistHandler.fileData = fileData.item(0);
    }
  }

  /**
   * Filter table data
   * @param filterData Filter input
   */
  playListFilter(filterValue) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  /**
   * Confirmation to delete file
   * @param deleteData - Delete file data
   */
  deletefile(filename) {
    this.playlistHandler.deleteFileName = filename;
    this.open(this.confirmationModal, 'delete');
  }

  /** Delete the selected file */
  proceedDelete() {
    this.http.delete(`${this.apiUrl}delete/` + this.playlistHandler.deleteFileName).subscribe(res => {
      this.playlistHandler.deleteFileName = null;
      this.updateTableData(res);
      this.closeModal();
      this.toastr.success('Successfully Deleted');
    });
  }

  ngOnDestroy() {
    this.playlistHandler = {
      modelClose: null,
      isPlayListLoading: false,
      uploadedFileIsInValid: false,
      fileData: null,
      duration: null,
      playAudio: null,
      audioIsPlaying: {
        name: null
      },
      deleteFileName: null
    };
  }
}
