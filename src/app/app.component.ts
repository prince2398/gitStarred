import { Component, OnInit, HostListener } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { faStar } from '@fortawesome/free-regular-svg-icons';
import {
  faExclamationCircle,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'gitStarred';
  url = 'https://api.github.com/search/repositories'; //API url
  date = new Date();
  query = 'sort:>0 created:>';
  nextPage;
  lastPage;
  repos = [];
  requestLimitReached = false;
  limitReset; //time to reset request limit reached timer
  noMoreRepos = false;
  faStar = faStar; //icon
  faExclamationCircle = faExclamationCircle; //icon
  faChevronUp = faChevronUp; //icon

  constructor(
    private http: HttpClient,
    private spinner: NgxSpinnerService,
    public datepipe: DatePipe
  ) {}

  ngOnInit() {
    this.spinner.show();

    this.loadInitialRepos().then(
      (res) => {
        this.spinner.hide();
        this.loadNextPage();
      },
      (rej) => {
        if (this.requestLimitReached) {
          this.spinner.hide();
        }
      }
    );
  }

  async loadInitialRepos() {
    return new Promise((resolve, reject) => {
      //Params
      this.date.setDate(this.date.getDate() - 30);
      this.query =
        this.query + this.datepipe.transform(this.date, 'yyyy-MM-dd');
      let params = { q: this.query, sort: 'stars', per_page: '10', page: '1' };
      // getting initial repos
      this.http
        .get(this.url, { params: params, observe: 'response' })
        .subscribe(
          (resp) => {
            if (resp.status == 200) {
              this.appendRepos(resp.body['items']);
              this.updateLinks(resp.headers.get('link'));
              resolve();
            }
          },
          (err) => {
            this.requestLimitReached = true;
            this.limitReset = err.headers.get('X-Ratelimit-Reset') + '000';
            // console.log(err.headers.get("X-Ratelimit-Reset"));
            reject();
          }
        );
    });
  }

  //Loading a next Page of Repositories and adding to the repos array
  loadNextPage() {
    if (this.nextPage && !this.noMoreRepos) {
      this.http.get(this.nextPage, { observe: 'response' }).subscribe(
        (resp) => {
          if (resp.status == 200) {
            this.appendRepos(resp.body['items']);
            this.updateLinks(resp.headers.get('link'));
            if (this.nextPage == this.lastPage) {
              this.noMoreRepos = true;
              this.spinner.hide();
            }
          }
        },
        (err) => {
          this.requestLimitReached = true;
          this.limitReset = err.headers.get('X-Ratelimit-Reset') + '000';
          this.spinner.hide();
          // console.log(err);
        }
      );
    }
  }

  //Updating Next Page on Every request
  updateLinks(links) {
    links.split(',').forEach((link) => {
      if (link.split(';')[1] == ' rel="next"') {
        this.nextPage = link.split(';')[0].replace('<', '').replace('>', '');
      }
      if (link.split(';')[1] == ' rel="last"') {
        this.lastPage = link.split(';')[0];
      }
    });
  }

  appendRepos(items) {
    items.forEach((item) => {
      let repo = {};
      repo['name'] = item['name'];
      repo['html_url'] = item['html_url'];
      repo['desc'] = item['description'];
      repo['created'] = new Date(item['created_at']);
      repo['stars'] = item['stargazers_count'];
      repo['issues'] = item['open_issues'];
      repo['ownerName'] = item['owner']['login'];
      repo['ownerAvatar'] = item['owner']['avatar_url'];
      repo['ownerProfile'] = item['owner']['html_url'];
      repo['stars_url'] = repo['html_url'] + '/stargazers';
      repo['issues_url'] = repo['html_url'] + '/issues';
      this.repos.push(repo);
    });
  }

  //For Scroll to Top Button
  @HostListener('window:scroll', []) onWindowScroll() {
    this.scrollToTop();
  }
  scrollToTop() {
    if (
      document.body.scrollTop > 20 ||
      document.documentElement.scrollTop > 20
    ) {
      document.getElementById('scroll-to-top').style.display = 'block';
    } else {
      document.getElementById('scroll-to-top').style.display = 'none';
    }
  }
  toTop() {
    (function smoothscroll() {
      var currentScroll =
        document.documentElement.scrollTop || document.body.scrollTop;
      if (currentScroll > 0) {
        window.requestAnimationFrame(smoothscroll);
        window.scrollTo(0, currentScroll - currentScroll / 8);
      }
    })();
  }

  // Request Timer Reset
  timerUp(event) {
    if (event.action == 'done') {
      this.requestLimitReached = false;
      if (this.nextPage) {
        this.onScroll();
      } else {
        window.location.reload();
      }
      // console.log("Finished");
    }
  }

  //Loading new repos on scrolling down
  onScroll() {
    if (!this.requestLimitReached && !this.noMoreRepos) {
      this.loadNextPage();
      this.spinner.show();
    } else {
      this.spinner.hide();
    }
  }
}
