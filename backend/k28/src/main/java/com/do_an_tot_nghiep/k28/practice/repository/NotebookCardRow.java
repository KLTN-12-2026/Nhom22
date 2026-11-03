package com.do_an_tot_nghiep.k28.practice.repository;

public record NotebookCardRow(
        Long theId,
        String tu,
        String tuLoai,
        String phienAm,
        String nghiaVi,
        String viDuEn,
        Long boTheId,
        String boTheTen
) {
}
