package com.careflow.auth.config;

import com.careflow.auth.entity.Role;
import com.careflow.auth.entity.RoleName;
import com.careflow.auth.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner seedDefaultRoles(RoleRepository roleRepository) {
        return args -> {
            ensureRole(roleRepository, RoleName.ROLE_ADMIN, "Platform administrator");
            ensureRole(roleRepository, RoleName.ROLE_DOCTOR, "Licensed clinician");
            ensureRole(roleRepository, RoleName.ROLE_PATIENT, "Registered patient");
        };
    }

    private void ensureRole(RoleRepository repo, RoleName name, String description) {
        if (repo.findByName(name).isEmpty()) {
            repo.save(new Role(name, description));
        }
    }
}
