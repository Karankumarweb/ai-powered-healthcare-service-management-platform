package com.careflow.auth.repository;

import com.careflow.auth.entity.Role;
import com.careflow.auth.entity.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(RoleName name);
}
