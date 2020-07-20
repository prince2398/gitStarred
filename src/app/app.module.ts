import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { NgxSpinnerModule } from "ngx-spinner";
import { HttpClientModule } from "@angular/common/http";
import { AppComponent } from './app.component';
import { DatePipe } from "@angular/common";

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    InfiniteScrollModule,
    NgxSpinnerModule,
    HttpClientModule
  ],
  providers: [ 
    DatePipe 
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
