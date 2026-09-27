package com.do_an_tot_nghiep.k28.common.security;

import java.io.Serializable;
import java.util.Set;

public record AuthUser(
        Long id,
        String email,
        Set<String> roles
) implements Serializable {
}
