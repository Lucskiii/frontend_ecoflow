import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { PortfolioComponent } from './pages/portfolio/portfolio.component';
import { AnalysisCitiesComponent } from './pages/analysis-cities/analysis-cities.component';
import { WeatherPriceAnalysisComponent } from './pages/weather-price-analysis/weather-price-analysis.component';
import { BiPrototypeComponent } from './pages/bi-prototype/bi-prototype.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'portfolio', component: PortfolioComponent, canActivate: [authGuard] },
  { path: 'analysis-cities', component: AnalysisCitiesComponent, canActivate: [authGuard] },
  { path: 'weather-price-analysis', component: WeatherPriceAnalysisComponent, canActivate: [authGuard] },
  { path: 'bi-prototype', component: BiPrototypeComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' }
];
