#include <stdio.h>
#include <stdlib.h>
#include <omp.h>
#define N 1000
double *alloc_mat(int n){
    return (double*) malloc(sizeof(double) * n * n);
}
void init_rand(double *m,int n){
    for(int i=0;i<n*n;i++) m[i] = (double)rand() / RAND_MAX;
}
void zero_mat(double *m,int n){
    for(int i=0;i<n*n;i++) m[i] = 0.0;
}
void add_seq(double *a,double *b,double *c,int n){
    for(int i=0;i<n;i++){
        for(int j=0;j<n;j++){
            c[i*n+j] = a[i*n+j] + b[i*n+j];
        }
    }
}
void sub_seq(double *a,double *b,double *c,int n){
    for(int i=0;i<n;i++){
        for(int j=0;j<n;j++){
            c[i*n+j] = a[i*n+j] - b[i*n+j];
        }
    }
}
void trans_seq(double *a,double *t,int n){
    for(int i=0;i<n;i++){
        for(int j=0;j<n;j++){
            t[j*n+i] = a[i*n+j];
        }
    }
}
void mul_seq(double *a,double *b,double *c,int n){
    for(int i=0;i<n;i++){
        for(int j=0;j<n;j++){
            double s = 0.0;
            for(int k=0;k<n;k++) s += a[i*n+k] * b[k*n+j];
                c[i*n+j] = s;
        }
    }
}
void add_par(double *a,double *b,double *c,int n,int threads){
#pragma omp parallel for num_threads(threads)
    for(int i=0;i<n;i++){
        for(int j=0;j<n;j++){
            c[i*n+j] = a[i*n+j] + b[i*n+j];
        }
    }
}
void sub_par(double *a,double *b,double *c,int n,int threads){
#pragma omp parallel for num_threads(threads)
    for(int i=0;i<n;i++){
        for(int j=0;j<n;j++){
            c[i*n+j] = a[i*n+j] - b[i*n+j];
        }
    }
}
void trans_par(double *a,double *t,int n,int threads){
#pragma omp parallel for num_threads(threads)
    for(int i=0;i<n;i++){
        for(int j=0;j<n;j++){
            t[j*n+i] = a[i*n+j];
        }
    }
}
void mul_par(double *a,double *b,double *c,int n,int threads){
#pragma omp parallel for num_threads(threads)
    for(int i=0;i<n;i++){
        for(int j=0;j<n;j++){
            double s = 0.0;
            for(int k=0;k<n;k++) s += a[i*n+k] * b[k*n+j];
                c[i*n+j] = s;
        }
    }
}
int main(){
    int n = N;
    double *A = alloc_mat(n);
    double *B = alloc_mat(n);
    double *Cadd = alloc_mat(n);
    double *Csub = alloc_mat(n);
    double *Cmul = alloc_mat(n);
    double *Ctrans = alloc_mat(n);
    srand(1);
    init_rand(A,n);
    init_rand(B,n);
    zero_mat(Cadd,n);
    zero_mat(Csub,n);
    zero_mat(Cmul,n);
    zero_mat(Ctrans,n);
    double t0,t1;
    t0 = omp_get_wtime();
    add_seq(A,B,Cadd,n);
    t1 = omp_get_wtime();
    double t_add_seq = t1 - t0;
    printf("sequential add: %f s\n"
        , t_add_seq);
    t0 = omp_get_wtime();
    sub_seq(A,B,Csub,n);
    t1 = omp_get_wtime();
    double t_sub_seq = t1 - t0;
    printf("sequential sub: %f s\n"
        , t_sub_seq);
    t0 = omp_get_wtime();
    mul_seq(A,B,Cmul,n);
    t1 = omp_get_wtime();
    double t_mul_seq = t1 - t0;
    printf("sequential mul: %f s\n"
        , t_mul_seq);
    t0 = omp_get_wtime();
    trans_seq(A,Ctrans,n);
    t1 = omp_get_wtime();
    double t_trans_seq = t1 - t0;
    printf("sequential transpose:%f s\n"
        , t_trans_seq);
    omp_set_nested(1);
    int max_threads = omp_get_max_threads();
    int sections_threads = 4;
    int inner_threads = max_threads / sections_threads;
    if(inner_threads < 1) inner_threads = 1;
    double sec_times[4];
    t0 = omp_get_wtime();
#pragma omp parallel sections num_threads(sections_threads)
    {
#pragma omp section
        {
            double s = omp_get_wtime();
            add_par(A,B,Cadd,n,inner_threads);
            sec_times[0] = omp_get_wtime() - s;
        }
#pragma omp section
        {
            double s = omp_get_wtime();
            sub_par(A,B,Csub,n,inner_threads);
            sec_times[1] = omp_get_wtime() - s;
        }
#pragma omp section
        {
            double s = omp_get_wtime();
            mul_par(A,B,Cmul,n,inner_threads);
            sec_times[2] = omp_get_wtime() - s;
        }
#pragma omp section
        {
            double s = omp_get_wtime();
            trans_par(A,Ctrans,n,inner_threads);
            sec_times[3] = omp_get_wtime() - s;
        }
    }
    t1 = omp_get_wtime();
    double wall_all = t1 - t0;
    printf("\nparallel (sections + inner parallel for) times:\n");
    printf("add parallel: %f s\n"
        , sec_times[0]);
    printf("sub parallel: %f s\n"
        , sec_times[1]);
    printf("mul parallel: %f s\n"
        , sec_times[2]);
    printf("transpose parallel: %f s\n"
        , sec_times[3]);
    printf("wall time (all 4): %f s\n"
        , wall_all);
    printf("\nspeedups (seq_time / section_time):\n");
    printf("add speedup: %f\n"
        , t_add_seq / sec_times[0]);
    printf("sub speedup: %f\n"
        , t_sub_seq / sec_times[1]);
    printf("mul speedup: %f\n"
        , t_mul_seq / sec_times[2]);
    printf("transpose speedup: %f\n"
        , t_trans_seq / sec_times[3]);
    free(A); free(B); free(Cadd); free(Csub); free(Cmul); free(Ctrans);
    return 0;
}