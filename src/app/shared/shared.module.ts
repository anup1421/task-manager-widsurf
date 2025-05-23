import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Components
import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import { ErrorMessageComponent } from './error-message.component';
import { LoadingSpinnerComponent } from './loading-spinner.component';

// Directives
import { ClickOutsideDirective } from './click-outside.directive';

// Pipes
import { FilterPipe } from './filter.pipe';
import { SortByPipe } from './sort-by.pipe';

const materialModules = [
  MatButtonModule,
  MatInputModule,
  MatCardModule,
  MatIconModule,
  MatMenuModule,
  MatToolbarModule,
  MatSidenavModule,
  MatListModule,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatDialogModule,
  MatSnackBarModule,
  MatSelectModule,
  MatDatepickerModule,
  MatNativeDateModule,
  MatCheckboxModule,
  MatProgressSpinnerModule
];

const sharedComponents = [
  ConfirmationDialogComponent,
  ErrorMessageComponent,
  LoadingSpinnerComponent
];

const sharedDirectives = [
  ClickOutsideDirective
];

const sharedPipes = [
  FilterPipe,
  SortByPipe
];

@NgModule({
  declarations: [
    ...sharedComponents,
    ...sharedDirectives,
    ...sharedPipes
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    HttpClientModule,
    ...materialModules
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    HttpClientModule,
    ...materialModules,
    ...sharedComponents,
    ...sharedDirectives,
    ...sharedPipes
  ],
  providers: [
    MatDatepickerModule,
    MatNativeDateModule
  ]
})
export class SharedModule { }
