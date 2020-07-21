import { Component, OnInit, HostListener } from '@angular/core';
import { NgxSpinnerService } from "ngx-spinner";
import { HttpClient } from "@angular/common/http";
import { DatePipe } from "@angular/common";
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'gitStarred';
  url = "https://api.github.com/search/repositories"
  date = new Date();
  query = "sort:>0 created:>";
  nextPage;
  lastPage;
  repos = [];
  requestLimitReached = false;
  limitReset;
  noMoreRepos=false;

  constructor(
    private http:HttpClient, 
    private spinner: NgxSpinnerService,
    public datepipe: DatePipe
  ) {}

  ngOnInit(){
    this.loadInitialRepos().then(res=>{
      this.loadNextPage();
    });
  }

  async loadInitialRepos(){
    // Params
    return new Promise( (resolve, reject)=>{
      this.date.setDate(this.date.getDate()-30);
      this.query = this.query + this.datepipe.transform(this.date, 'yyyy-MM-dd');
      let params = { q: this.query,
                      sort: "stars",
                      per_page: "5",
                      page: "1"
      }
      // getting initial repos
      this.http.get(this.url,{params:params, observe: "response"})
        .subscribe(
          resp =>{
            if(resp.status == 200){
              this.appendRepos(resp.body["items"]);
              this.updateLinks(resp.headers.get("link"))
              resolve()
            }
          },
          err=>{
            this.requestLimitReached = true;
            this.limitReset = err.headers.get("X-Ratelimit-Reset") + "000";
            // console.log(err.headers.get("X-Ratelimit-Reset"));
            reject();
          }
        )
    });
  }
  
  loadNextPage(){
    
    if(this.nextPage && !this.noMoreRepos){
      this.http.get(this.nextPage,{ observe: "response"})
        .subscribe(
          resp =>{
            if(resp.status == 200){
              this.appendRepos(resp.body["items"]);
              this.updateLinks(resp.headers.get("link"))
              if(this.nextPage == this.lastPage){
                this.noMoreRepos = true;
                this.spinner.hide()
              }
            }
          },
          err=>{
            this.requestLimitReached = true;
            this.limitReset = err.headers.get("X-Ratelimit-Reset") + "000";
            // console.log(err.headers.get("X-Ratelimit-Reset"));
            this.spinner.hide()
            // console.log(err);
          }
        )
    }
  }

  updateLinks(links){
    links.split(',').forEach( link =>{
      if(link.split(";")[1] == ' rel="next"'){
        this.nextPage = link.split(";")[0].replace("<","").replace(">","");
      }
      if(link.split(";")[1] == ' rel="last"'){
        this.lastPage = link.split(";")[0];
      }
    })
  } 

  appendRepos(items){
    items.forEach(item=>{
      let repo ={};
      repo["name"] = item["name"];
      repo["html_url"] = item["html_url"];
      repo["desc"] = item["description"];
      repo["created"] = new Date(item["created_at"]);
      repo["stars"] = item["stargazers_count"];
      repo["issues"] = item["open_issues"]
      repo["ownerName"] = item["owner"]["login"];
      repo["ownerAvatar"] = item["owner"]["avatar_url"];
      repo["ownerProfile"] = item["owner"]["html_url"];
      repo["stars_url"] = repo["html_url"]+"/stargazers";
      repo["issues_url"] = repo["html_url"]+"/issues";
      this.repos.push(repo);
    })
  }
  @HostListener("window:scroll", []) onWindowScroll() {
    this.scrollToTop();
  }
  scrollToTop(){
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        document.getElementById("scroll-to-top").style.display = "block";
    } else {
        document.getElementById("scroll-to-top").style.display = "none";
    }
  }
  toTop(){
    document.body.scrollTop = document.documentElement.scrollTop = 0;
  }

  timerUp(event){
    if (event.action == "done") { 
      this.requestLimitReached = false;
      if ( this.nextPage){
        this.onScroll();
      }else{
        window.location.reload()
        // this.ngOnInit();
      }
      // console.log("Finished"); 
    }
  }
  onScroll(){
    if(!this.requestLimitReached && !this.noMoreRepos){
      this.loadNextPage();
      this.spinner.show();
    }else{
      this.spinner.hide();
    }
  }
  
}
