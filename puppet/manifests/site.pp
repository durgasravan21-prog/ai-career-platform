node default {
  # Install Git
  package { 'git':
    ensure => installed,
  }

  # Install Docker
  package { 'docker':
    ensure => installed,
  }

  # Ensure Docker service is running
  service { 'docker':
    ensure  => running,
    enable  => true,
    require => Package['docker'],
  }

  # Configure deployment directory
  file { '/opt/ai-career-platform':
    ensure => directory,
    owner  => 'root',
    group  => 'root',
    mode   => '0755',
  }

  # Configure firewall rules
  firewall { '100 allow http and https access':
    dport  => [80, 443, 3000, 8000],
    proto  => 'tcp',
    action => 'accept',
  }
}
