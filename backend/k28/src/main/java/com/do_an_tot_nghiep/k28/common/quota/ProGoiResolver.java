package com.do_an_tot_nghiep.k28.common.quota;

import org.springframework.stereotype.Component;

@Component
public class ProGoiResolver implements GoiDichVuResolver {

    public static final String PRO = "PRO";

    @Override
    public String goiMa(Long nguoiDungId) {
        return PRO;
    }
}
