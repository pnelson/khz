module.exports = function(grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    connect: {
      server: {
        options: {
          port: 4000,
          base: 'build',
          livereload: true
        }
      }
    },

    watch: {
      root: {
        files: 'src/*',
        tasks: ['gitinfo', 'copy:root', 'replace:app']
      },
      app: {
        files: 'src/app/*.js',
        tasks: 'neuter:app'
      },
      templates: {
        files: 'src/app/templates/*.hbs',
        tasks: 'emberTemplates'
      },
      scripts: {
        files: ['tmp/app.js', 'tmp/templates.js'],
        tasks: 'concat:app'
      },
      styles: {
        files: 'src/static/styles/*.scss',
        tasks: 'sass:build'
      },
      livereload: {
        files: 'build/**/*',
        options: { livereload: true }
      }
    },

    clean: {
      build: 'build',
      tmp: 'tmp'
    },

    copy: {
      root: {
        cwd: 'src/',
        src: '*',
        dest: 'build/',
        expand: true,
        filter: 'isFile'
      },
      sounds: {
        expand: true,
        cwd: 'src/static/sounds/',
        src: '**',
        dest: 'build/static/sounds/'
      },
      normalize: {
        src: 'bower_components/normalize-css/normalize.css',
        dest: 'bower_components/normalize-css/normalize.scss'
      },
      font_awesome: {
        expand: true,
        cwd: 'bower_components/font-awesome/fonts/',
        src: 'fontawesome-webfont.*',
        dest: 'build/static/fonts/'
      }
    },

    sass: {
      build: {
        files: {
          'tmp/styles.css': 'src/static/styles/styles.scss'
        },
        options: {
          includePaths: ['bower_components']
        }
      }
    },

    neuter: {
      app: {
        src: 'src/app/app.js',
        dest: 'tmp/app.neutered.js'
      },
      options: {
        basePath: 'src/app/'
      }
    },

    emberTemplates: {
      compile: {
        files: {
          'tmp/templates.js': 'src/app/templates/**/*.hbs'
        },
        options: {
          templateBasePath: 'src/app/templates/'
        }
      }
    },

    concat: {
      build: {
        src: [
          'bower_components/jquery/jquery.js',
          'bower_components/handlebars/handlebars.runtime.js',
          'bower_components/ember/ember.js',
          'tmp/app.neutered.js',
          'tmp/templates.js'
        ],
        dest: 'tmp/app.js'
      },
      release: {
        src: [
          'bower_components/jquery/jquery.js',
          'bower_components/handlebars/handlebars.runtime.js',
          'bower_components/ember/ember.prod.js',
          'tmp/app.neutered.js',
          'tmp/templates.js'
        ],
        dest: 'tmp/app.js'
      }
    },

    cssmin: {
      app: {
        files: {
          'tmp/styles.css': 'tmp/styles.css'
        },
        options: {
          keepSpecialComments: 0
        }
      }
    },

    uglify: {
      app: {
        files: {
          'tmp/app.js': 'tmp/app.js'
        }
      }
    },

    replace: {
      app: {
        options: {
          patterns: [{
            match: 'git',
            replacement: '<%= gitinfo.local.branch.current.SHA %>'
          }]
        },
        files: {
          'build/index.html': 'build/index.html'
        }
      }
    },

    rename: {
      scripts: {
        src: 'tmp/app.js',
        dest: 'build/static/app-<%= gitinfo.local.branch.current.SHA %>.js'
      },
      styles: {
        src: 'tmp/styles.css',
        dest: 'build/static/styles-<%= gitinfo.local.branch.current.SHA %>.css'
      }
    },

    'gh-pages': {
      options: {
        base: 'build'
      },
      src: ['**']
    }

  });

  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-ember-templates');
  grunt.loadNpmTasks('grunt-gh-pages');
  grunt.loadNpmTasks('grunt-gitinfo');
  grunt.loadNpmTasks('grunt-neuter');
  grunt.loadNpmTasks('grunt-rename');
  grunt.loadNpmTasks('grunt-replace');

  grunt.registerTask('test', [
    //'jshint'
  ]);

  grunt.registerTask('build', function(target) {
    grunt.task.run([
      'gitinfo',
      'clean:build',
      'copy:root',
      'replace:app',
      'copy:sounds',
      'copy:normalize',
      'copy:font_awesome',
      'emberTemplates',
      'sass:build',
      'neuter:app'
    ]);
    if (target === 'release') {
      grunt.task.run('concat:release');
      grunt.task.run('cssmin:app');
      grunt.task.run('uglify:app');
    } else {
      grunt.task.run('concat:build');
    }
    grunt.task.run('rename');
  });

  grunt.registerTask('release', [
    'build:release',
    'test'
  ]);

  grunt.registerTask('server', function(target) {
    grunt.task.run([
      target === 'release' ? 'build:release' : 'build',
      'connect',
      'watch'
    ]);
  });

  //grunt.registerTask('default', ['jshint', 'test', 'build']);

};
